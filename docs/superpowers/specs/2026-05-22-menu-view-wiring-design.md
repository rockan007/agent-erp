# Menu & View Wiring Design

**Date:** 2026-05-22
**Status:** Draft

## Overview

Menus, views, and ACL rules are exported from modules but never consumed. The module loader drops `menus`, `views`, and `security` at the boundary. There is no API to serve them to the frontend. The frontend starts with an empty `menuItems` and never populates it. This spec wires the full pipeline: module loader → startup registration → API → frontend.

## Current State

- Modules export `menus`, `views`, `security` in `index.ts` — these are silently ignored
- `ModuleLoader.loadIndex` return type only carries `models`, `controllers`, `data`
- `installModules()` only registers models — doesn't touch menus, views, or ACL
- No API endpoint for `/api/menus` or `/api/views`
- Frontend store starts `menuItems: []` and `setMenuItems` is never called at init
- e2e tests inject `menuItems` directly via `window.__STORE__`
- ACL registry (`AclRegistry`) exists but is never populated at startup

## Design

### 1. Extend ModuleLoader to Capture menus, views, security

**`packages/core/src/module-scanner.ts`:**

Add to `ModuleLoader.loadIndex` return type:
```ts
views?: { id: string; model: string; type: string; title: string; fields: Record<string, unknown>[]; layout?: Record<string, unknown> }[];
menus?: { id: string; name: string; icon?: string; sequence: number; parentId?: string; action?: string }[];
security?: AclRule[];
```

**`packages/core/src/module-registry.ts`:**

Add to `ModuleDefinition`:
```ts
views: ViewSpec[];
menus: MenuItem[];
security: AclRule[];
```

`scanModules()` reads these from `moduleExports` and stores them on `ModuleDefinition`.

### 2. Register ACL Rules at Startup

**`packages/admin/vite.config.ts`** — after `scanModules()`:

Import `getAclRegistry` from `@erp/core`. Iterate all installed modules, call `aclRegistry.register(mod.security)` for each. This ensures all ACL rules are loaded before any API call is handled.

**`modules/base/index.ts`** — export `security` as `baseAcl` (already done, just flows through).

### 3. API Endpoint: `GET /api/menus`

Added as a special route in the vite middleware, **before** the controller dispatcher.

Request flow:
1. Extract JWT from `Authorization: Bearer <token>` header
2. Verify token → get `{ userId, groups }`
3. Collect all views from all installed modules → map keyed by `view.id`
4. Filter menus:
   - If menu has no `action` (section header) → always include
   - If menu has `action`: resolve the view by ID → check `aclRegistry.check(view.model, 'read', groups)` → include only if true
5. Return `{ menus: MenuItem[], views: Record<string, ViewSpec> }`

`GET /api/views/:id` is not needed yet — all views come in the `/api/menus` payload.

### 4. Frontend

**`packages/admin/src/store.ts`:**

New state:
```ts
viewsMap: Record<string, ViewSpec>;
```

New actions:
- `fetchMenus()` — calls `GET /api/menus`, sets `menuItems` + `viewsMap`
- `selectMenu(id)` — resolves menu → action → view from `viewsMap`, calls `setActiveView` and `setActiveMenu`

**`packages/admin/src/App.tsx`:**

`useEffect` — when `token` is truthy and `menuItems.length === 0`, calls `fetchMenus()`. Shows a loading indicator while fetching.

**`packages/admin/src/components/MenuRenderer.tsx`:**

`onClick` handler already calls `setActiveMenu(key)`. Add a call to `selectMenu(key)` which resolves the view. The old `setActiveMenu` behavior of just setting the active menu ID without resolving the view is superseded by `selectMenu`.

### 5. ACL Filtering Logic

**Server-side only.** The `/api/menus` endpoint returns only the menus (and views) the user can read. If the user's groups don't have `read` on the model, the menu simply doesn't appear.

Menu items without `action` (section/grouping headers like `settings_root`) are always included — they're navigation structure, not model-bound. But if all their children are filtered out, they'll render as empty submenus (acceptable; antd handles this).

### 6. Error & Edge Cases

- **No token / expired token**: `/api/menus` returns 401. Frontend `fetchMenus` catches error, logs user out.
- **Empty modules**: Returns empty `menus` array, empty `views` map. Frontend shows "No modules loaded" placeholder (already exists in `MenuRenderer`).
- **Menu with action referencing nonexistent view**: Skips the menu, logs a warning server-side.
- **User with no groups**: Token has `groups: []`. ACL check returns false for all models. Only section headers (menus without action) would appear — effectively nothing visible.

## Files Changed

| File | Action |
|------|--------|
| `packages/core/src/module-registry.ts` | Modify — add views, menus, security to ModuleDefinition |
| `packages/core/src/module-scanner.ts` | Modify — extend ModuleLoader return type, pass through new fields |
| `packages/admin/vite.config.ts` | Modify — register ACL rules at startup, add /api/menus route |
| `packages/admin/src/store.ts` | Modify — add viewsMap state, fetchMenus action, selectMenu action |
| `packages/admin/src/App.tsx` | Modify — useEffect to fetchMenus on auth |
| `packages/admin/src/components/MenuRenderer.tsx` | Modify — call selectMenu on click |

## Not in Scope

- Field-level security / record rules filtering on menus — ACL model-level read is sufficient
- `/api/views/:id` endpoint — unnecessary until we need lazy loading
- View-level security filtering (hiding specific fields per group) — existing field-security module handles that separately when we wire it into ViewRenderer
