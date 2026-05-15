import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';
import path from 'path';

function erpPlugin() {
  return {
    name: 'erp-plugin',
    configureServer(server: any) {
      // --- Startup: init DB, scan modules, install, migrate, seed ---
      server.httpServer?.once('listening', async () => {
        try {
          const { initConnection } = await import('@erp/data');
          const { scanModules, installModules, getModuleRegistry } = await import('@erp/core');
          const { diffAndMigrate } = await import('@erp/domain');

          const knex = initConnection({
            host: process.env.DB_HOST ?? 'localhost',
            port: parseInt(process.env.DB_PORT ?? '5432'),
            database: process.env.DB_NAME ?? 'agent_erp',
            user: process.env.DB_USER ?? 'postgres',
            password: process.env.DB_PASSWORD ?? 'postgres',
          });

          const modulesPath = path.resolve(__dirname, '..', '..', 'modules');
          const moduleNames = await scanModules({ modulesPath });

          const order = getModuleRegistry().resolveDependencies();
          await installModules(order, knex);

          // Run migrations for all registered models
          const { getModelRegistry } = await import('@erp/domain');
          for (const [, def] of getModelRegistry().getAll()) {
            await diffAndMigrate(knex, [def]);
          }

          console.log(`[erp] Modules installed: ${order.join(', ')}`);
        } catch (err) {
          console.error('[erp] Startup failed:', err);
        }
      });

      // --- Auth middleware ---
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.method === 'POST' && req.url === '/api/auth/login') {
          const body = await readBody(req);
          try {
            const { login, password } = JSON.parse(body);
            const { getKnex } = await import('@erp/data');
            const { verifyPassword, signToken } = await import('@erp/core/auth');

            const knex = getKnex();
            const user = await knex('res_users')
              .where({ login, active: true })
              .first();

            if (!user) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid credentials' }));
              return;
            }

            const valid = await verifyPassword(password, user.password);
            if (!valid) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid credentials' }));
              return;
            }

            const groupRows = await knex('res_users_groups_rel')
              .where({ user_id: user.id })
              .select('group_id');

            const token = signToken({ userId: user.id, groups: groupRows.map((r: any) => String(r.group_id)) });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              token,
              user: { id: user.id, name: user.name, groups: groupRows.map((r: any) => String(r.group_id)) },
            }));
          } catch (err) {
            console.error('auth error:', err);
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid credentials' }));
          }
        } else {
          next();
        }
      });

      // --- Generic controller route registrar ---
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const { method, url } = req;
        if (!method || !url) { next(); return; }

        // Try to match a controller route
        try {
          const { verifyToken } = await import('@erp/core/auth');
          const { getModuleRegistry } = await import('@erp/core');

          const registry = getModuleRegistry();
          for (const [, modDef] of registry.getAll()) {
            if (!modDef.installed) continue;
            for (const Ctrl of modDef.controllers) {
              const routes = (Ctrl as any).routes;
              if (!routes) continue;
              for (const route of routes) {
                const match = matchRoute(method, url, route.method, route.path);
                if (!match) continue;

                // Extract JWT and get uid
                let uid = 0;
                const authHeader = req.headers['authorization'];
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
                const ctx = { uid, params: match.params, body };
                try {
                  const result = await ctrl[route.handler](ctx);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(result ?? {}));
                } catch (handlerErr) {
                  console.error('[erp] handler error:', handlerErr);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
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

function matchRoute(
  reqMethod: string,
  reqUrl: string,
  routeMethod: string,
  routePath: string,
): { params: Record<string, string> } | null {
  if (reqMethod.toUpperCase() !== routeMethod.toUpperCase()) return null;

  const reqParts = reqUrl.split('?')[0]!.split('/').filter(Boolean);
  const routeParts = routePath.split('/').filter(Boolean);

  if (routeParts.some(p => p === '*')) {
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

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export default defineConfig({
  plugins: [erpPlugin(), react()],
  server: {
    port: 3000,
  },
});
