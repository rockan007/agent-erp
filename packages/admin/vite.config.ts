import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';
import path from 'path';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function matchRoute(
  reqMethod: string,
  reqUrl: string,
  routeMethod: string,
  routePath: string,
): { params: Record<string, string> } | null {
  if (reqMethod.toUpperCase() !== routeMethod.toUpperCase()) return null;

  const reqParts = reqUrl.split('?')[0]!.split('/').filter(Boolean);
  const routeParts = routePath.split('/').filter(Boolean);

  if (routeParts.some((p) => p === '*')) {
    // Wildcard route — match prefix
    const wildIdx = routeParts.indexOf('*');
    const prefix = routeParts.slice(0, wildIdx);
    if (reqParts.length < prefix.length) return null;
    for (let i = 0; i < prefix.length; i++) {
      if (prefix[i] !== reqParts[i]) return null;
    }
    return { params: {} };
  }

  if (reqParts.length !== routeParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < routeParts.length; i++) {
    const rp = routeParts[i]!;
    const rq = reqParts[i]!;
    if (rp.startsWith(':')) {
      params[rp.slice(1)] = rq;
    } else if (rp !== rq) {
      return null;
    }
  }

  return { params };
}

function erpPlugin() {
  // Cached references populated at startup — reused by /api/menus handler
  // to avoid ssrLoadModule returning a different module instance (empty singleton).
  let cachedGetModuleRegistry: (() => unknown) | null = null;
  let cachedGetAclRegistry: (() => unknown) | null = null;
  let cachedVerifyToken: ((token: string) => unknown) | null = null;

  return {
    name: 'erp-plugin',
    configureServer(server: import('vite').ViteDevServer) {
      // --- Startup: init DB, scan modules, install, migrate, seed ---
      server.httpServer?.once('listening', async () => {
        try {
          const { initConnection } = await server.ssrLoadModule('@erp/data');
          const { diffAndMigrate } = await server.ssrLoadModule('@erp/domain');
          const { scanModules, installModules, runModuleSeeds, getModuleRegistry } = await server.ssrLoadModule('@erp/core');

          const knex = initConnection({
            host: process.env.DB_HOST ?? 'localhost',
            port: parseInt(process.env.DB_PORT ?? '5432', 10),
            database: process.env.DB_DATABASE ?? 'agent_erp',
            user: process.env.DB_USER ?? 'postgres',
            password: process.env.DB_PASSWORD ?? 'admin',
          });

          const modulesPath = path.resolve(__dirname, '..', '..', 'modules');

          // SSR-aware loader: uses Vite's ssrLoadModule to import .ts files
          const loader = {
            loadManifest: async (modulePath: string) => {
              const m = await server.ssrLoadModule(path.join(modulePath, 'manifest.ts'));
              return m.default;
            },
            loadIndex: async (modulePath: string) => server.ssrLoadModule(path.join(modulePath, 'index.ts')),
          };

          await scanModules({ modulesPath }, loader);

          // Register ACL rules from all modules
          const { getAclRegistry: getAcl } = await server.ssrLoadModule('@erp/core');
          const aclReg = getAcl();
          for (const [, modDef] of getModuleRegistry().getAll()) {
            if (modDef.security.length > 0) {
              aclReg.register(modDef.security);
            }
          }

          const order = getModuleRegistry().resolveDependencies();
          await installModules(order);

          // Run migrations for all registered models
          const { getModelRegistry } = await server.ssrLoadModule('@erp/domain');
          for (const [, def] of getModelRegistry().getAll()) {
            await diffAndMigrate(knex, [def]);
          }

          // Run seed data after tables are created
          await runModuleSeeds(order, knex);

          console.log(`[erp] Modules installed: ${order.join(', ')}`);

          // Cache registry references so /api/menus uses the same singleton instances
          cachedGetModuleRegistry = getModuleRegistry;
          cachedGetAclRegistry = getAcl;
          const { verifyToken } = await server.ssrLoadModule('@erp/core');
          cachedVerifyToken = verifyToken as (token: string) => unknown;
        } catch (err) {
          console.error('[erp] Startup failed:', err);
        }
      });

      // --- Generic controller route registrar ---
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const { method, url } = req;
        if (!method || !url) { next(); return; }

        // /api/menus — serve filtered menus + views
        if (method === 'GET' && url.split('?')[0] === '/api/menus') {
          try {
            // Use cached references from startup to ensure same singleton instances
            if (!cachedGetModuleRegistry || !cachedGetAclRegistry || !cachedVerifyToken) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Server starting up — please retry' }));
              return;
            }

            let groups: string[] = [];
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
              const token = authHeader.slice(7);
              try {
                const payload = cachedVerifyToken(token) as { userId: number; groups: string[] };
                groups = payload.groups;
              } catch {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid or expired token' }));
                return;
              }
            } else {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Authentication required' }));
              return;
            }

            const aclRegistry = cachedGetAclRegistry() as { check: (model: string, op: string, groups: string[]) => boolean };
            const moduleRegistry = cachedGetModuleRegistry() as { getAll: () => Map<string, { installed: boolean; views: Array<{ id: string; model: string }>; menus: Array<{ id: string; action?: string }> }> };

            // Collect all views from installed modules, keyed by ID
            const viewsMap: Record<string, unknown> = {};
            const allMenus: unknown[] = [];

            for (const [, modDef] of moduleRegistry.getAll()) {
              if (!modDef.installed) continue;
              for (const view of modDef.views) {
                viewsMap[view.id] = view;
              }
              for (const menu of modDef.menus) {
                allMenus.push(menu);
              }
            }

            // Filter menus by ACL: include if no action (section header), or if user can read the target model
            const filteredMenus = allMenus.filter((menu: Record<string, unknown>) => {
              const action = menu.action as string | undefined;
              if (!action) return true;
              const view = viewsMap[action] as Record<string, unknown> | undefined;
              if (!view) {
                console.warn(`[erp] Menu "${menu.id}" references unknown view "${action}"`);
                return false;
              }
              const model = view.model as string;
              return aclRegistry.check(model, 'read', groups);
            });

            // Filter views map to only include views accessible by remaining menus
            const accessibleActionIds = new Set(
              filteredMenus
                .filter((m: Record<string, unknown>) => m.action)
                .map((m: Record<string, unknown>) => m.action as string)
            );
            const filteredViews: Record<string, unknown> = {};
            for (const id of accessibleActionIds) {
              if (viewsMap[id]) {
                filteredViews[id] = viewsMap[id];
              }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ menus: filteredMenus, views: viewsMap }));
          } catch (err) {
            console.error('[erp] /api/menus error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
          return;
        }

        // Try to match a controller route
        try {
          const { verifyToken, getModuleRegistry, getRequestLocale } = await server.ssrLoadModule('@erp/core');

          const registry = getModuleRegistry();
          for (const [, modDef] of registry.getAll()) {
            if (!modDef.installed) continue;
            for (const Ctrl of modDef.controllers) {
              const { routes } = (Ctrl as unknown as {
                routes?: Array<{ path: string; method: string; handler: string }>;
              });
              if (!routes) continue;
              for (const route of routes) {
                const match = matchRoute(method, url, route.method, route.path);
                if (!match) continue;

                // Extract JWT and get uid
                let uid = 0;
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                  const token = authHeader.slice(7);
                  try {
                    const payload = verifyToken(token);
                    uid = payload.userId;
                  } catch {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid or expired token' }));
                    return;
                  }
                } else if (route.auth !== false) {
                  res.writeHead(401, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Authentication required' }));
                  return;
                }

                // Read body for POST/PUT
                let body: Record<string, unknown> = {};
                if (method === 'POST' || method === 'PUT') {
                  const raw = await readBody(req);
                  try { body = JSON.parse(raw); } catch { body = {}; }
                }

                const ctrl = new Ctrl();
                const locale = getRequestLocale(req.headers['accept-language']);
                const ctx = { uid, params: match.params, body, locale };
                try {
                  const result = await ctrl[route.handler](ctx);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(result ?? {}));
                } catch (handlerErr) {
                  console.error('[erp] handler error:', handlerErr);
                  const message = handlerErr instanceof Error ? handlerErr.message : 'Internal server error';
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: message }));
                }
                return;
              }
            }
          }
        } catch (err) {
          console.error('[erp] route error:', err);
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [erpPlugin(), react()],
  envDir: path.resolve(__dirname, '..', '..'),
  resolve: {
    alias: {
      '@erp/core': path.resolve(__dirname, '..', 'core', 'src'),
      '@erp/domain': path.resolve(__dirname, '..', 'domain', 'src'),
      '@erp/data': path.resolve(__dirname, '..', 'data', 'src'),
      '@erp/admin': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
  },
});
