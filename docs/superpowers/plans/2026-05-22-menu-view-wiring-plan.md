# Menu & View Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire module-exported menus, views, and ACL rules through the server to the frontend, so admin users see sidebar menus and can navigate to views.

**Architecture:** Extend ModuleDefinition/Loader to carry menus/views/security → register ACL at startup → serve filtered menus via `/api/menus` → frontend fetches on mount and renders. 6 files touched across core and admin packages.

**Tech Stack:** TypeScript, Vite SSR, React, Zustand, Ant Design

---

### Task 1: Extend ModuleDefinition and ModuleLoader to carry menus, views, security

**Files:**
- Modify: `packages/core/src/module-registry.ts`
- Modify: `packages/core/src/module-scanner.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Add types and fields to module-registry.ts**

Add `ModuleMenuItem`, `ModuleViewSpec` interfaces and update `ModuleDefinition` in `packages/core/src/module-registry.ts`:

```ts
import type { BaseModel } from '@erp/domain';
import type { AclRule } from './security/acl';

export interface ModuleMenuItem {
  id: string;
  name: string;
  icon?: string;
  sequence: number;
  parentId?: string;
  action?: string;
}

export interface ModuleViewSpec {
  id: string;
  model: string;
  type: string;
  title: string;
  fields: { name: string; label?: string; widget?: string; readonly?: boolean; required?: boolean; options?: Record<string, unknown> }[];
  layout?: { type: string; items: { title?: string; fields: string[]; widget?: string }[] };
}

export interface ModuleManifest {
  name: string;
  version: string;
  depends: string[];
  auto_install?: boolean;
  application?: boolean;
}

export interface RouteDefinition {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  handler: string;
  auth?: boolean;
}

export interface ControllerClass {
  new (): object;
  routes?: RouteDefinition[];
}

export interface ModuleDefinition {
  manifest: ModuleManifest;
  models: (typeof BaseModel)[];
  controllers: ControllerClass[];
  dataFiles: Array<(knex: Record<string, unknown>) => Promise<void>>;
  views: ModuleViewSpec[];
  menus: ModuleMenuItem[];
  security: AclRule[];
  installed: boolean;
}

export class ModuleRegistry {
  private modules = new Map<string, ModuleDefinition>();

  private installOrder: string[] = [];

  register(module: ModuleDefinition): void {
    if (this.modules.has(module.manifest.name)) {
      throw new Error(`Module "${module.manifest.name}" is already registered.`);
    }
    this.modules.set(module.manifest.name, module);
  }

  get(name: string): ModuleDefinition | undefined {
    return this.modules.get(name);
  }

  getAll(): Map<string, ModuleDefinition> {
    return new Map(this.modules);
  }

  resolveDependencies(): string[] {
    const resolved: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (name: string): void => {
      if (visited.has(name)) return;
      if (visiting.has(name)) throw new Error(`Circular dependency detected: ${name}`);
      visiting.add(name);

      const mod = this.modules.get(name);
      if (!mod) throw new Error(`Module "${name}" not found`);

      for (const dep of mod.manifest.depends) {
        visit(dep);
      }

      visiting.delete(name);
      visited.add(name);
      resolved.push(name);
    };

    for (const name of this.modules.keys()) {
      visit(name);
    }

    this.installOrder = resolved;
    return resolved;
  }

  getInstallOrder(): string[] {
    return [...this.installOrder];
  }

  getInstalledModules(): string[] {
    return this.installOrder.filter((name) => this.modules.get(name)?.installed);
  }
}

let _moduleRegistry: ModuleRegistry | null = null;

export function getModuleRegistry(): ModuleRegistry {
  if (!_moduleRegistry) {
    _moduleRegistry = new ModuleRegistry();
  }
  return _moduleRegistry;
}
```

- [ ] **Step 2: Update ModuleLoader return type and scanModules in module-scanner.ts**

```ts
import { readdirSync, existsSync, lstatSync } from 'fs';
import { join, resolve } from 'path';
import { getModuleRegistry, ModuleManifest, ModuleDefinition } from './module-registry';
import type { AclRule } from './security/acl';
import type { ModuleMenuItem, ModuleViewSpec } from './module-registry';

export interface ScanOptions {
  modulesPath: string;
}

export interface ModulePathInfo {
  name: string;
  absPath: string;
}

/**
 * Discover module directories. Returns list of { name, absPath }.
 * Does NOT import any files — caller must load manifest + index.
 */
export function discoverModules(options: ScanOptions): ModulePathInfo[] {
  const absPath = resolve(options.modulesPath);

  if (!existsSync(absPath)) {
    return [];
  }

  const entries = readdirSync(absPath);
  const result: ModulePathInfo[] = [];

  for (const entry of entries) {
    const modulePath = join(absPath, entry);

    if (!lstatSync(modulePath).isDirectory()) continue;

    const manifestPath = join(modulePath, 'manifest.ts');
    const indexPath = join(modulePath, 'index.ts');

    if (!existsSync(manifestPath) || !existsSync(indexPath)) continue;

    result.push({ name: entry, absPath: modulePath });
  }

  return result;
}

export interface ModuleLoader {
  loadManifest(modulePath: string): Promise<ModuleManifest>;
  loadIndex(modulePath: string): Promise<{
    models?: Record<string, unknown>[];
    controllers?: Record<string, unknown>[];
    data?: ((knex: Record<string, unknown>) => Promise<void>)[];
    views?: ModuleViewSpec[];
    menus?: ModuleMenuItem[];
    security?: AclRule[];
  }>;
}

/**
 * Scan and register modules using the provided loader.
 * The loader abstracts how .ts files are imported (native import, ssrLoadModule, etc.).
 */
export async function scanModules(options: ScanOptions, loader: ModuleLoader): Promise<string[]> {
  const registry = getModuleRegistry();
  const discovered = discoverModules(options);
  const loaded: string[] = [];

  for (const mod of discovered) {
    const manifest = await loader.loadManifest(mod.absPath);
    const moduleExports = await loader.loadIndex(mod.absPath);

    const moduleDef: ModuleDefinition = {
      manifest,
      models: (moduleExports.models ?? []) as unknown as ModuleDefinition['models'],
      controllers: (moduleExports.controllers ?? []) as unknown as ModuleDefinition['controllers'],
      dataFiles: moduleExports.data ?? [],
      views: moduleExports.views ?? [],
      menus: moduleExports.menus ?? [],
      security: moduleExports.security ?? [],
      installed: false,
    };

    registry.register(moduleDef);
    loaded.push(manifest.name);
  }

  return loaded;
}

export async function installModules(moduleNames: string[]): Promise<void> {
  const registry = getModuleRegistry();

  for (const name of moduleNames) {
    const mod = registry.get(name);
    if (!mod) throw new Error(`Module "${name}" not found`);

    const { getModelRegistry } = await import('@erp/domain');
    const modelRegistry = getModelRegistry();
    for (const modelClass of mod.models) {
      modelRegistry.register(modelClass);
    }

    mod.installed = true;
  }
}

export async function runModuleSeeds(moduleNames: string[], knex: Record<string, unknown>): Promise<void> {
  const registry = getModuleRegistry();

  for (const name of moduleNames) {
    const mod = registry.get(name);
    if (!mod) continue;

    for (const seedFn of mod.dataFiles) {
      await seedFn(knex);
    }
  }
}
```

- [ ] **Step 3: Export new types from packages/core/src/index.ts**

```ts
export const VERSION = '0.1.0';

export { ModuleRegistry, getModuleRegistry } from './module-registry';
export type { ModuleDefinition, ModuleManifest, ControllerClass, RouteDefinition, ModuleMenuItem, ModuleViewSpec } from './module-registry';
export { scanModules, installModules, discoverModules, runModuleSeeds } from './module-scanner';
export type { ScanOptions, ModuleLoader, ModulePathInfo } from './module-scanner';

export {
  AclRegistry, getAclRegistry,
  FieldSecurityRegistry, getFieldSecurityRegistry,
  RecordRuleRegistry, getRecordRuleRegistry,
} from './security';
export type { AclRule, FieldSecurityRule, RecordRule } from './security';
export { encryptField, decryptField, encryptRecord, decryptRecord } from './security';
export { maskValue, maskRecord } from './security';
export type { MaskPattern } from './security';
export { writeAudit, getAuditLog } from './security';
export type { AuditEntry } from './security';

export { hashPassword, verifyPassword, signToken, verifyToken, storeCode, verifyCode } from './auth';
export type { TokenPayload } from './auth';

export { getRequestLocale, tError } from './i18n';
```

- [ ] **Step 4: Verify type-check passes**

Run: `pnpm --filter @erp/core exec tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Verify existing tests still pass**

Run: `pnpm --filter @erp/core test`
Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/module-registry.ts packages/core/src/module-scanner.ts packages/core/src/index.ts
git commit -m "feat: extend ModuleDefinition to carry menus, views, and security rules"
```

---

### Task 2: Register ACL rules at startup and add /api/menus endpoint

**Files:**
- Modify: `packages/admin/vite.config.ts`

- [ ] **Step 1: Add ACL registration after scanModules in vite.config.ts**

After the `scanModules` call and before the middleware setup, add ACL registration. Insert these lines after `await scanModules({ modulesPath }, loader);` (after line 83, before the `const order = ...` line):

```ts
          // Register ACL rules from all modules
          const { getAclRegistry: getAcl } = await server.ssrLoadModule('@erp/core');
          const aclReg = getAcl();
          for (const [, modDef] of getModuleRegistry().getAll()) {
            if (modDef.security.length > 0) {
              aclReg.register(modDef.security);
            }
          }
```

- [ ] **Step 2: Add GET /api/menus handler in the middleware**

Inside the existing `server.middlewares.use(...)` callback, add the `/api/menus` check **before** the controller dispatch loop. Insert these lines after `if (!method || !url) { next(); return; }` (after line 107):

```ts
        // /api/menus — serve filtered menus + views
        if (method === 'GET' && url.split('?')[0] === '/api/menus') {
          try {
            const { verifyToken: verify, getAclRegistry: getAcl } = await server.ssrLoadModule('@erp/core');

            let uid = 0;
            let groups: string[] = [];
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
              const token = authHeader.slice(7);
              try {
                const payload = verify(token);
                uid = payload.userId;
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

            const aclRegistry = getAcl();
            const moduleRegistry = getModuleRegistry();

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
              if (!action) return true; // section header
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
            res.end(JSON.stringify({ menus: filteredMenus, views: filteredViews }));
          } catch (err) {
            console.error('[erp] /api/menus error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
          return;
        }
```

Note: use `Record<string, unknown>` types for the handler since we're in vite config and don't want to import admin types statically. The response will structurally match `{ menus: MenuItem[], views: Record<string, ViewSpec> }` expected by the frontend.

- [ ] **Step 3: Verify the server starts without errors**

Run: `pnpm --filter @erp/admin dev`
Expected: `[erp] Modules installed: base` in console, no startup errors

- [ ] **Step 4: Commit**

```bash
git add packages/admin/vite.config.ts
git commit -m "feat: register ACL rules at startup and add /api/menus endpoint"
```

---

### Task 3: Add fetchMenus and selectMenu to frontend store

**Files:**
- Modify: `packages/admin/src/store.ts`

- [ ] **Step 1: Add viewsMap state, fetchMenus, and selectMenu to store.ts**

Replace the store implementation. The current initial state (lines 27-34) adds `viewsMap: {}`. After `authView: 'login'`, add the new actions `fetchMenus` and `selectMenu`:

```ts
import { create } from 'zustand';
import type { MenuItem, AppState, BreadcrumbItem } from './types';

export type { MenuItem, ViewSpec, ViewField, ViewLayout, ViewLayoutItem, BreadcrumbItem } from './types';

export function computeBreadcrumbs(
  menuItems: MenuItem[],
  activeMenuId: string | null,
): BreadcrumbItem[] {
  if (!activeMenuId) return [];

  const breadcrumbs: BreadcrumbItem[] = [];
  let currentId: string | undefined = activeMenuId;

  while (currentId) {
    const id = currentId;
    const item = menuItems.find((m) => m.id === id);
    if (!item) break;
    breadcrumbs.unshift({ id: item.id, name: item.name });
    currentId = item.parentId;
  }

  return breadcrumbs;
}

export const useStore = create<AppState>((set, get) => ({
  menuItems: [],
  activeMenuId: null,
  activeView: null,
  user: null,
  token: null,
  siderCollapsed: true,
  breadcrumbs: [],
  authView: 'login',
  viewsMap: {},

  setMenuItems: (items) => {
    const { activeMenuId } = get();
    set({ menuItems: items, breadcrumbs: computeBreadcrumbs(items, activeMenuId) });
  },
  setActiveMenu: (id) => {
    const { menuItems } = get();
    set({ activeMenuId: id, breadcrumbs: computeBreadcrumbs(menuItems, id) });
  },
  setActiveView: (view) => set({ activeView: view }),
  setUser: (user) => set({ user }),
  setSiderCollapsed: (collapsed) => set({ siderCollapsed: collapsed }),
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
  setAuthView: (view) => set({ authView: view }),

  fetchMenus: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const res = await fetch('/api/menus', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          get().logout();
        }
        return;
      }
      const data = await res.json();
      set({ menuItems: data.menus, viewsMap: data.views });
    } catch {
      // Server unavailable — user stays on dashboard
    }
  },

  selectMenu: (id) => {
    const { menuItems, viewsMap } = get();
    const menu = menuItems.find((m) => m.id === id);
    const view = menu?.action ? viewsMap[menu.action] ?? null : null;
    set({
      activeMenuId: id,
      activeView: view,
      breadcrumbs: computeBreadcrumbs(menuItems, id),
    });
  },

  initializeAuth: () => {
    const token = localStorage.getItem('erp_token');
    const userJson = localStorage.getItem('erp_user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        set({ token, user });
      } catch {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
      }
    }
  },

  login: async (login: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('erp_token', data.token);
    localStorage.setItem('erp_user', JSON.stringify(data.user));
    set({ token: data.token, user: data.user });
  },

  logout: () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    set({ token: null, user: null, activeView: null, menuItems: [], viewsMap: {} });
  },

  register: async (data) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Registration failed');
    return json;
  },

  verifyRegistration: async (userId, code) => {
    const res = await fetch('/api/auth/verify-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Verification failed');
    return json;
  },

  forgotPassword: async (email) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Request failed');
    return json;
  },

  resetPassword: async (userId, code, password) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Reset failed');
    return json;
  },
}));

declare global {
  interface Window { __STORE__?: typeof useStore; }
}
if (typeof window !== 'undefined') {
  window.__STORE__ = useStore;
}
```

- [ ] **Step 2: Update AppState type to include new fields**

Add to `packages/admin/src/types.ts` after `breadcrumbs: BreadcrumbItem[];` line:

```ts
  viewsMap: Record<string, ViewSpec>;
```

And after `setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;` line:

```ts
  fetchMenus: () => Promise<void>;
  selectMenu: (id: string) => void;
```

- [ ] **Step 3: Verify type-check passes**

Run: `pnpm --filter @erp/admin exec tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add packages/admin/src/store.ts packages/admin/src/types.ts
git commit -m "feat: add fetchMenus and selectMenu to frontend store"
```

---

### Task 4: Wire App.tsx to fetch menus on auth, update MenuRenderer

**Files:**
- Modify: `packages/admin/src/App.tsx`
- Modify: `packages/admin/src/components/MenuRenderer.tsx`

- [ ] **Step 1: Add useEffect in App.tsx to fetch menus after login**

In `App.tsx`, in the `App` component, add the effect after the `authView` line and before the early return for `!user`:

```tsx
const App: React.FC = () => {
  const { t: tc } = useTranslation('common');
  const activeView = useStore((s) => s.activeView);
  const siderCollapsed = useStore((s) => s.siderCollapsed);
  const setSiderCollapsed = useStore((s) => s.setSiderCollapsed);
  const user = useStore((s) => s.user);
  const token = useStore((s) => s.token);
  const menuItems = useStore((s) => s.menuItems);
  const fetchMenus = useStore((s) => s.fetchMenus);
  const screens = useBreakpoint();
  const isMobile = screens.md === false;

  const authView = useStore((s) => s.authView);

  useEffect(() => {
    if (token && menuItems.length === 0) {
      fetchMenus();
    }
  }, [token, menuItems.length, fetchMenus]);

  if (!user) {
```

- [ ] **Step 2: Update MenuRenderer onClick to use selectMenu**

In `packages/admin/src/components/MenuRenderer.tsx`, change the `onClick` handler and add `selectMenu`:

```tsx
export const MenuRenderer: React.FC<Props> = ({ onItemClick }) => {
  const menuItems = useStore((s) => s.menuItems);
  const activeMenuId = useStore((s) => s.activeMenuId);
  const selectMenu = useStore((s) => s.selectMenu);

  const tree = buildTree(menuItems);
  const antdItems = toAntdItems(tree);

  const onClick: MenuProps['onClick'] = ({ key }) => {
    selectMenu(key);
    onItemClick?.();
  };
```

- [ ] **Step 3: Verify type-check passes**

Run: `pnpm --filter @erp/admin exec tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add packages/admin/src/App.tsx packages/admin/src/components/MenuRenderer.tsx
git commit -m "feat: fetch menus on auth and wire menu clicks to view resolution"
```

---

### Task 5: End-to-end verification

- [ ] **Step 1: Start the dev server**

Run: `pnpm --filter @erp/admin dev`
Expected: server starts, `[erp] Modules installed: base` in console

- [ ] **Step 2: Open the browser to verify login and menus**

Navigate to `http://localhost:3000`, log in as `admin` / `admin`.
Expected: After login, sidebar shows "Contacts" (with Partners) and "Settings" (with Users, Groups). Dashboard greeting displays.

- [ ] **Step 3: Click "Users" menu**

Click "Users" under "Settings" in the sidebar.
Expected: Table view loads showing user records.

- [ ] **Step 4: Click a user row to view detail**

Click on a user row in the table.
Expected: Form view loads showing user detail with tabs (General, Contact, Security).

- [ ] **Step 5: Verify existing e2e tests still pass**

Run: `npx playwright test --config=packages/admin/playwright.config.ts`
Expected: all e2e tests pass

Note: The e2e tests inject state via `window.__STORE__`, so they bypass the new `/api/menus` flow. They should continue to work unaffected.

- [ ] **Step 6: Commit any final adjustments**

```bash
git add -A
git commit -m "chore: final adjustments from e2e verification"
```
