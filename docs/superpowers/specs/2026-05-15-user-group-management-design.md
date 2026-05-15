# User & Group Management Design

**Date:** 2026-05-15
**Status:** Draft

## Overview

Add user management and role/group management to the base module, including default admin credentials for first login.

## Current State

- `ResUsers` model exists (name, login, password, email, active, groups many2many to res.groups)
- Login endpoint works (`POST /api/auth/login` via Vite middleware)
- Login page, logout, session persistence all functional
- `ResGroups` model does NOT exist
- No user views, no user controller, no group views, no group controller
- "Users" menu item exists but has no `action` (dead link)
- No seed data — cannot log in without manually inserting a user into PostgreSQL
- Controller `static routes` are defined but not wired to the Vite server (only `/api/auth/login` is hardcoded)

## Design

### 1. ResGroups Model

**File:** `modules/base/models/res_groups.ts`

| Field | Type | Notes |
|-------|------|-------|
| `name` | char (required) | e.g. "Administrator", "Base User" |
| `description` | text | Human-readable description |

`ResUsers.groups` is already defined as `many2many` to `res.groups`, so no changes needed to `ResUsers`.

### 2. Seed Data

**File:** `modules/base/data/seed.ts`

Inserted when the base module is installed (auto_install: true means on first startup):

- **Groups:** `{ name: 'admin', description: 'System Administrator' }` and `{ name: 'base_user', description: 'Base User' }`
- **User:** `{ login: 'admin', password: <bcrypt("admin")>, name: 'Administrator', active: true }`
- **Group assignment:** admin user → admin group (via `res_users_groups_rel`)

Seed data must be idempotent — skip insertion if records already exist.

**Execution mechanism:** The module scanner (`packages/core/src/module-scanner.ts`) already reads `moduleExports.data ?? []` into `dataFiles`. Modify `installModules()` to execute each data file after registering models. Each data file exports an async function: `export default async (knex: Knex) => { ... }`. The scanner calls it with the Knex instance, so seed data can insert directly.

### 3. Generic Controller Route Registrar

**File:** `packages/admin/vite.config.ts` (modify)

Currently only `/api/auth/login` is hardcoded. Add a generic middleware that:

1. Imports all module controllers (from `modules/base/index.ts` `controllers` export)
2. Reads each controller's `static routes` array
3. Registers Express-style route handlers: `{method} {path} → handler(ctx) → JSON`

Handler signature: `(ctx: { uid: number; params: Record<string, string>; body: Record<string, unknown> }) => Promise<unknown>`

The `uid` is extracted from the JWT token in the `Authorization: Bearer <token>` header (via `verifyToken()` from `@erp/core/auth`). If the token is invalid or missing, return 401.

This automatically wires PartnerController, UserController, and GroupController.

### 4. UserController

**File:** `modules/base/controllers/user_controller.ts`

| Method | Path | Handler |
|--------|------|---------|
| GET | `/api/users` | `list` — search all users |
| GET | `/api/users/:id` | `detail` — browse single user |
| POST | `/api/users` | `create` — bcrypt-hash password if provided, create user |
| PUT | `/api/users/:id` | `update` — update user fields, sync groups via many2many |
| DELETE | `/api/users/:id` | `delete` — unlink user |

Password handling: on create, if `password` is in body, bcrypt-hash it before storing. On update, only re-hash if `password` is present and non-empty.

### 5. GroupController

**File:** `modules/base/controllers/group_controller.ts`

| Method | Path | Handler |
|--------|------|---------|
| GET | `/api/groups` | `list` — search all groups |
| GET | `/api/groups/:id` | `detail` — browse single group |
| POST | `/api/groups` | `create` — create group |
| PUT | `/api/groups/:id` | `update` — update group |
| DELETE | `/api/groups/:id` | `delete` — unlink group |

### 6. Views

**User Views:**

| View ID | Type | Fields |
|---------|------|--------|
| `res.users.form` | form | name, login, password, email, active, groups |
| `res.users.tree` | tree | name, login, email, active |
| `res.users.search` | search | name, login, email |

Form layout uses tabs: "General" (name, login, active), "Contact" (email), "Security" (password, groups).

Groups field widget: `many2many` — multi-select from available groups.

**Group Views:**

| View ID | Type | Fields |
|---------|------|--------|
| `res.groups.form` | form | name, description |
| `res.groups.tree` | tree | name, description |

### 7. Menu

Update `modules/base/views/menus.ts`:

- Add `action: 'res.users.tree'` to the existing `user_menu`
- Add `group_menu` under `settings_root` with `action: 'res.groups.tree'`

```
Settings (sequence: 90)
├── Users (sequence: 10)   → res.users.tree
└── Groups (sequence: 20)  → res.groups.tree
```

### 8. ACL

Add `res.groups` ACL rules to `modules/base/security/acl.ts`:

- `admin` group: full CRUD on `res.groups`
- `base_user` group: read-only on `res.groups`

## Files Changed

| File | Action |
|------|--------|
| `modules/base/models/res_groups.ts` | Create |
| `modules/base/data/seed.ts` | Create |
| `modules/base/controllers/user_controller.ts` | Create |
| `modules/base/controllers/group_controller.ts` | Create |
| `modules/base/views/res_users.form.ts` | Create |
| `modules/base/views/res_users.tree.ts` | Create |
| `modules/base/views/res_users.search.ts` | Create |
| `modules/base/views/res_groups.form.ts` | Create |
| `modules/base/views/res_groups.tree.ts` | Create |
| `modules/base/views/menus.ts` | Modify (add actions + group menu) |
| `modules/base/security/acl.ts` | Modify (add res.groups rules) |
| `modules/base/index.ts` | Modify (export new models/views/controllers/data) |
| `packages/admin/vite.config.ts` | Modify (generic controller router) |
| `packages/core/src/module-scanner.ts` | Modify (execute seed data in installModules) |
