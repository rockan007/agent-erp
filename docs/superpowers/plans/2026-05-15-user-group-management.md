# User & Group Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user management, group/role management, and default admin credentials to the base module.

**Architecture:** Follow existing patterns — model classes with decorators, controllers with static routes, view specs for the admin UI. Add a Vite plugin for DB/module initialization on server startup, and a generic controller route registrar that wires all controller routes through the Vite dev server with JWT auth.

**Tech Stack:** TypeScript, Knex (PostgreSQL), bcrypt, JWT, React + Ant Design 5 (admin UI)

---

### Task 1: ResGroups Model

**Files:**
- Create: `modules/base/models/res_groups.ts`

- [ ] **Step 1: Create ResGroups model**

```typescript
import { Model, model, fields } from '@erp/domain';

@model({ _name: 'res.groups', _description: 'User Group / Role' })
export class ResGroups extends Model {
  @fields.char({ required: true })
  name!: string;

  @fields.text({})
  description!: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add modules/base/models/res_groups.ts
git commit -m "feat: add ResGroups model"
```

---

### Task 2: Seed Data

**Files:**
- Create: `modules/base/data/seed.ts`

- [ ] **Step 1: Create seed data file**

```typescript
import type { Knex } from 'knex';
import { hashPassword } from '@erp/core/auth';

export default async function seed(knex: Knex): Promise<void> {
  // Insert groups (idempotent)
  const existingAdmin = await knex('res_groups').where({ name: 'admin' }).first();
  if (!existingAdmin) {
    await knex('res_groups').insert({ name: 'admin', description: 'System Administrator' });
  }

  const existingBaseUser = await knex('res_groups').where({ name: 'base_user' }).first();
  if (!existingBaseUser) {
    await knex('res_groups').insert({ name: 'base_user', description: 'Base User' });
  }

  // Get admin group ID
  const adminGroup = await knex('res_groups').where({ name: 'admin' }).first();

  // Insert admin user (idempotent)
  const existingAdminUser = await knex('res_users').where({ login: 'admin' }).first();
  let adminUserId: number;
  if (!existingAdminUser) {
    const hashed = await hashPassword('admin');
    const [inserted] = await knex('res_users').insert({
      name: 'Administrator',
      login: 'admin',
      password: hashed,
      email: 'admin@example.com',
      active: true,
    }).returning('id');
    adminUserId = inserted.id;
  } else {
    adminUserId = existingAdminUser.id;
  }

  // Assign admin user to admin group (idempotent)
  if (adminGroup) {
    const existingRel = await knex('res_users_groups_rel')
      .where({ user_id: adminUserId, group_id: adminGroup.id })
      .first();
    if (!existingRel) {
      await knex('res_users_groups_rel').insert({
        user_id: adminUserId,
        group_id: adminGroup.id,
      });
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add modules/base/data/seed.ts
git commit -m "feat: add seed data (admin user + default groups)"
```

---

### Task 3: Execute Seed Data in Module Scanner

**Files:**
- Modify: `packages/core/src/module-scanner.ts`

- [ ] **Step 1: Modify installModules to accept Knex and execute data files**

The scanner currently reads `dataFiles` but never executes them. Change `installModules` to accept a `Knex` instance and execute each data file's default export.

Read the current file first, then apply changes:

In `installModules`, after `modelRegistry.register(modelClass)`, add code to execute each `dataFiles` entry. Each data file's default export is an async function `(knex: Knex) => Promise<void>`.

Change the function signature from:
```typescript
export async function installModules(moduleNames: string[]): Promise<void> {
```
to:
```typescript
export async function installModules(moduleNames: string[], knex?: import('knex').Knex): Promise<void> {
```

And add at the end of the for loop (after `mod.installed = true`):
```typescript
    // Execute seed data files
    if (knex && mod.dataFiles && mod.dataFiles.length > 0) {
      for (const dataPath of mod.dataFiles) {
        const seedFn = (await import(dataPath)).default;
        if (typeof seedFn === 'function') {
          await seedFn(knex);
        }
      }
    }
```

Wait — `dataFiles` is currently `string[]` (just names, not paths). The scanner reads `moduleExports.data ?? []` and stores it. We need the actual import, not just a path string. Change the approach: store the seed function itself, not a path.

Update `ModuleDefinition` in `packages/core/src/module-registry.ts`:
```typescript
export interface ModuleDefinition {
  manifest: ModuleManifest;
  models: (typeof BaseModel)[];
  controllers: ControllerClass[];
  dataFiles: Array<(knex: any) => Promise<void>>;
  installed: boolean;
}
```

Then in `scanModules`, the `moduleExports.data ?? []` assignment is already correct since `moduleExports.data` will be `[seed]` (an array of functions). The type change in `ModuleDefinition.dataFiles` above ensures TypeScript accepts it.

And in `installModules`, iterate `mod.dataFiles` and call each with `knex`:
```typescript
export async function installModules(moduleNames: string[], knex?: any): Promise<void> {
  const registry = getModuleRegistry();

  for (const name of moduleNames) {
    const mod = registry.get(name);
    if (!mod) throw new Error(`Module "${name}" not found`);

    const { getModelRegistry } = await import('@erp/domain');
    const modelRegistry = getModelRegistry();
    for (const modelClass of mod.models) {
      modelRegistry.register(modelClass);
    }

    // Execute seed data
    if (knex) {
      for (const seedFn of mod.dataFiles) {
        await seedFn(knex);
      }
    }

    mod.installed = true;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/module-scanner.ts packages/core/src/module-registry.ts
git commit -m "feat: execute seed data in installModules"
```

---

### Task 4: Startup Initialization Plugin in vite.config.ts

**Files:**
- Modify: `packages/admin/vite.config.ts`

Currently nothing calls `scanModules` / `installModules` at startup, so models are never registered and tables are never created. Add a Vite plugin that initializes everything on server start.

- [ ] **Step 1: Replace vite.config.ts with full startup + auth + controller wiring**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import { getModuleRegistry } from '@erp/core';

function erpPlugin() {
  return {
    name: 'erp-plugin',
    configureServer(server: any) {
      // --- Startup: init DB, scan modules, install, migrate, seed ---
      server.httpServer?.once('listening', async () => {
        try {
          const { initConnection, getKnex } = await import('@erp/data');
          const { scanModules, installModules } = await import('@erp/core');
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

          const registry = getModuleRegistry();
          for (const [modName, modDef] of registry.getAll()) {
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
                const result = await ctrl[route.handler](ctx);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
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
```

- [ ] **Step 2: Commit**

```bash
git add packages/admin/vite.config.ts
git commit -m "feat: add startup initialization and generic controller route registrar"
```

---

### Task 5: UserController

**Files:**
- Create: `modules/base/controllers/user_controller.ts`

- [ ] **Step 1: Create UserController**

```typescript
import { envWithContext } from '@erp/domain';
import { hashPassword } from '@erp/core/auth';

export class UserController {
  static routes = [
    { path: '/api/users', method: 'GET' as const, handler: 'list' },
    { path: '/api/users/:id', method: 'GET' as const, handler: 'detail' },
    { path: '/api/users', method: 'POST' as const, handler: 'create' },
    { path: '/api/users/:id', method: 'PUT' as const, handler: 'update' },
    { path: '/api/users/:id', method: 'DELETE' as const, handler: 'delete' },
  ];

  async list(ctx: { uid: number }) {
    return envWithContext('res.users', { uid: ctx.uid }).search([]);
  }

  async detail(ctx: { uid: number; params: { id: string } }) {
    const records = await envWithContext('res.users', { uid: ctx.uid })
      .browse([parseInt(ctx.params.id)]);
    return records[0] ?? null;
  }

  async create(ctx: { uid: number; body: Record<string, unknown> }) {
    const { password, ...rest } = ctx.body;
    if (password && typeof password === 'string' && password.length > 0) {
      (rest as any).password = await hashPassword(password);
    }
    return envWithContext('res.users', { uid: ctx.uid }).create(rest);
  }

  async update(ctx: { uid: number; params: { id: string }; body: Record<string, unknown> }) {
    const { password, ...rest } = ctx.body;
    if (password && typeof password === 'string' && password.length > 0) {
      (rest as any).password = await hashPassword(password);
    }
    return envWithContext('res.users', { uid: ctx.uid })
      .write([parseInt(ctx.params.id)], rest);
  }

  async delete(ctx: { uid: number; params: { id: string } }) {
    return envWithContext('res.users', { uid: ctx.uid })
      .unlink([parseInt(ctx.params.id)]);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add modules/base/controllers/user_controller.ts
git commit -m "feat: add UserController with CRUD routes"
```

---

### Task 6: GroupController

**Files:**
- Create: `modules/base/controllers/group_controller.ts`

- [ ] **Step 1: Create GroupController**

```typescript
import { envWithContext } from '@erp/domain';

export class GroupController {
  static routes = [
    { path: '/api/groups', method: 'GET' as const, handler: 'list' },
    { path: '/api/groups/:id', method: 'GET' as const, handler: 'detail' },
    { path: '/api/groups', method: 'POST' as const, handler: 'create' },
    { path: '/api/groups/:id', method: 'PUT' as const, handler: 'update' },
    { path: '/api/groups/:id', method: 'DELETE' as const, handler: 'delete' },
  ];

  async list(ctx: { uid: number }) {
    return envWithContext('res.groups', { uid: ctx.uid }).search([]);
  }

  async detail(ctx: { uid: number; params: { id: string } }) {
    const records = await envWithContext('res.groups', { uid: ctx.uid })
      .browse([parseInt(ctx.params.id)]);
    return records[0] ?? null;
  }

  async create(ctx: { uid: number; body: Record<string, unknown> }) {
    return envWithContext('res.groups', { uid: ctx.uid }).create(ctx.body);
  }

  async update(ctx: { uid: number; params: { id: string }; body: Record<string, unknown> }) {
    return envWithContext('res.groups', { uid: ctx.uid })
      .write([parseInt(ctx.params.id)], ctx.body);
  }

  async delete(ctx: { uid: number; params: { id: string } }) {
    return envWithContext('res.groups', { uid: ctx.uid })
      .unlink([parseInt(ctx.params.id)]);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add modules/base/controllers/group_controller.ts
git commit -m "feat: add GroupController with CRUD routes"
```

---

### Task 7: User Views

**Files:**
- Create: `modules/base/views/res_users.form.ts`
- Create: `modules/base/views/res_users.tree.ts`
- Create: `modules/base/views/res_users.search.ts`

- [ ] **Step 1: Create res_users.form.ts**

```typescript
import type { ViewSpec } from '@erp/admin';

export const userForm: ViewSpec = {
  id: 'res.users.form',
  model: 'res.users',
  type: 'form',
  title: 'User',
  fields: [
    { name: 'name', label: 'Name', widget: 'text', required: true },
    { name: 'login', label: 'Login', widget: 'text', required: true },
    { name: 'password', label: 'Password', widget: 'text' },
    { name: 'email', label: 'Email', widget: 'text' },
    { name: 'active', label: 'Active', widget: 'text' },
    { name: 'groups', label: 'Groups', widget: 'text' },
  ],
  layout: {
    type: 'tabs',
    items: [
      { title: 'General', fields: ['name', 'login', 'active'] },
      { title: 'Contact', fields: ['email'] },
      { title: 'Security', fields: ['password', 'groups'] },
    ],
  },
};
```

- [ ] **Step 2: Create res_users.tree.ts**

```typescript
import type { ViewSpec } from '@erp/admin';

export const userTree: ViewSpec = {
  id: 'res.users.tree',
  model: 'res.users',
  type: 'tree',
  title: 'Users',
  fields: [
    { name: 'name', label: 'Name', widget: 'text' },
    { name: 'login', label: 'Login', widget: 'text' },
    { name: 'email', label: 'Email', widget: 'text' },
    { name: 'active', label: 'Active', widget: 'text' },
  ],
};
```

- [ ] **Step 3: Create res_users.search.ts**

```typescript
import type { ViewSpec } from '@erp/admin';

export const userSearch: ViewSpec = {
  id: 'res.users.search',
  model: 'res.users',
  type: 'search',
  title: 'Search Users',
  fields: [
    { name: 'name', label: 'Name' },
    { name: 'login', label: 'Login' },
    { name: 'email', label: 'Email' },
  ],
};
```

- [ ] **Step 4: Commit**

```bash
git add modules/base/views/res_users.form.ts modules/base/views/res_users.tree.ts modules/base/views/res_users.search.ts
git commit -m "feat: add user views (form, tree, search)"
```

---

### Task 8: Group Views

**Files:**
- Create: `modules/base/views/res_groups.form.ts`
- Create: `modules/base/views/res_groups.tree.ts`

- [ ] **Step 1: Create res_groups.form.ts**

```typescript
import type { ViewSpec } from '@erp/admin';

export const groupForm: ViewSpec = {
  id: 'res.groups.form',
  model: 'res.groups',
  type: 'form',
  title: 'Group',
  fields: [
    { name: 'name', label: 'Name', widget: 'text', required: true },
    { name: 'description', label: 'Description', widget: 'text' },
  ],
};
```

- [ ] **Step 2: Create res_groups.tree.ts**

```typescript
import type { ViewSpec } from '@erp/admin';

export const groupTree: ViewSpec = {
  id: 'res.groups.tree',
  model: 'res.groups',
  type: 'tree',
  title: 'Groups',
  fields: [
    { name: 'name', label: 'Name', widget: 'text' },
    { name: 'description', label: 'Description', widget: 'text' },
  ],
};
```

- [ ] **Step 3: Commit**

```bash
git add modules/base/views/res_groups.form.ts modules/base/views/res_groups.tree.ts
git commit -m "feat: add group views (form, tree)"
```

---

### Task 9: Update Menus

**Files:**
- Modify: `modules/base/views/menus.ts`

- [ ] **Step 1: Add action to Users menu and add Groups menu**

Change the `user_menu` entry to include an `action`, and add a `group_menu` entry:

```typescript
import type { MenuItem } from '@erp/admin';

export const baseMenus: MenuItem[] = [
  {
    id: 'contacts_root',
    name: 'Contacts',
    sequence: 10,
  },
  {
    id: 'partner_menu',
    name: 'Partners',
    sequence: 10,
    parentId: 'contacts_root',
    action: 'res.partner.tree',
  },
  {
    id: 'settings_root',
    name: 'Settings',
    sequence: 90,
  },
  {
    id: 'user_menu',
    name: 'Users',
    sequence: 10,
    parentId: 'settings_root',
    action: 'res.users.tree',
  },
  {
    id: 'group_menu',
    name: 'Groups',
    sequence: 20,
    parentId: 'settings_root',
    action: 'res.groups.tree',
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add modules/base/views/menus.ts
git commit -m "feat: wire Users menu action and add Groups menu"
```

---

### Task 10: Update ACL

**Files:**
- Modify: `modules/base/security/acl.ts`

- [ ] **Step 1: Add res.groups ACL rules**

```typescript
export const baseAcl = [
  {
    model: 'res.partner',
    group: 'base_user',
    permissions: { read: true, write: true, create: true, unlink: false },
  },
  {
    model: 'res.partner',
    group: 'admin',
    permissions: { read: true, write: true, create: true, unlink: true },
  },
  {
    model: 'res.users',
    group: 'admin',
    permissions: { read: true, write: true, create: true, unlink: true },
  },
  {
    model: 'res.groups',
    group: 'admin',
    permissions: { read: true, write: true, create: true, unlink: true },
  },
  {
    model: 'res.groups',
    group: 'base_user',
    permissions: { read: true, write: false, create: false, unlink: false },
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add modules/base/security/acl.ts
git commit -m "feat: add ACL rules for res.groups"
```

---

### Task 11: Update Module Index

**Files:**
- Modify: `modules/base/index.ts`

- [ ] **Step 1: Export all new models, views, controllers, and data**

```typescript
import { ResPartner } from './models/res_partner';
import { ResUsers } from './models/res_users';
import { ResGroups } from './models/res_groups';
import { partnerForm } from './views/res_partner.form';
import { partnerTree } from './views/res_partner.tree';
import { partnerSearch } from './views/res_partner.search';
import { userForm } from './views/res_users.form';
import { userTree } from './views/res_users.tree';
import { userSearch } from './views/res_users.search';
import { groupForm } from './views/res_groups.form';
import { groupTree } from './views/res_groups.tree';
import { baseMenus } from './views/menus';
import { PartnerController } from './controllers/partner_controller';
import { UserController } from './controllers/user_controller';
import { GroupController } from './controllers/group_controller';
import { baseAcl } from './security/acl';
import seed from './data/seed';

export const models = [ResPartner, ResUsers, ResGroups];
export const views = [partnerForm, partnerTree, partnerSearch, userForm, userTree, userSearch, groupForm, groupTree];
export const menus = baseMenus;
export const controllers = [PartnerController, UserController, GroupController];
export const security = baseAcl;
export const data = [seed];
```

- [ ] **Step 2: Commit**

```bash
git add modules/base/index.ts
git commit -m "feat: export new models, views, controllers, and seed data from base module"
```

---

### Task 12: Verify

- [ ] **Step 1: Build all packages**

```bash
pnpm build
```

Expected: TypeScript compiles without errors for all packages.

- [ ] **Step 2: Start dev server and test login**

```bash
pnpm --filter @erp/admin dev
```

Navigate to `http://localhost:3000`. Log in with `admin` / `admin`. Expected: login succeeds, dashboard renders.

- [ ] **Step 3: Test user CRUD via curl**

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"login":"admin","password":"admin"}' | jq -r '.token')

# List users
curl -s http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" | jq

# Create user
curl -s -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","login":"test","password":"test123","email":"test@example.com","active":true}' | jq
```

Expected: token is returned, user list shows admin, create returns new user.

- [ ] **Step 4: Test group CRUD via curl**

```bash
# List groups
curl -s http://localhost:3000/api/groups \
  -H "Authorization: Bearer $TOKEN" | jq

# Create group
curl -s -X POST http://localhost:3000/api/groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"manager","description":"Manager role"}' | jq
```

Expected: groups list shows admin and base_user, create returns new group.

- [ ] **Step 5: Commit (if any fixes needed)**

```bash
git add -A
git commit -m "chore: final verification fixes"
```
