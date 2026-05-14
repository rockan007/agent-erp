# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agent ERP — an Odoo-inspired general-purpose ERP framework. Node.js + TypeScript + PostgreSQL backend, React frontend. Monorepo managed by pnpm workspaces.

## Commands

```bash
# Install all dependencies (root)
pnpm install

# Build all packages
pnpm build

# Run all tests (vitest)
pnpm test

# Run tests for a single package
pnpm --filter @erp/data test
pnpm --filter @erp/domain test

# Run a single test file
pnpm --filter @erp/domain exec vitest run src/__tests__/env.test.ts

# Type-check a package
pnpm --filter @erp/domain exec tsc --noEmit

# Start admin dev server (port 3000)
pnpm --filter @erp/admin dev

# Lint / format
pnpm lint
pnpm format
```

## Architecture

```
agent-erp/
├── packages/           # 4-layer framework core
│   ├── data/           # @erp/data — Knex connection, query builder, migration runner
│   ├── domain/         # @erp/domain — ORM (Model, fields, env(), registry)
│   ├── core/           # @erp/core — module system, 6-layer security
│   └── admin/          # @erp/admin — React + Vite + Zustand shell (menu, view renderers)
└── modules/            # ERP business modules
    └── base/           # @erp-module/base — ResPartner, ResUsers, views, menus, ACL
```

**Layer dependency chain:** `data` ← `domain` ← `core` ← `admin` ← `modules/*`

## Layer Details

### @erp/data — Data Layer
- **`connection.ts`**: Knex singleton via `initConnection()` / `getKnex()`. Re-initializing destroys previous instance.
- **`query-builder.ts`**: Odoo-style domain DSL. `DomainTuple = [field, operator, value]`. Operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `like`, `ilike`, `in`, `not in`.
- **`migration-runner.ts`**: Idempotent migration runner tracking completed migrations in `erp_migrations` table.

### @erp/domain — ORM Layer
- **`types.ts`**: Central types — `FieldDefinition` (17 field types), `ModelDefinition` (with `_name`, `_inherit`, `_inherits`), `RecordData`.
- **`model.ts`**: `BaseModel` / `Model` / `TransientModel` / `AbstractModel` classes. `@model({_name, _description, _inherit, _inherits})` decorator reads field metadata via `Reflect.getMetadata` and stores on `_definition`.
- **`fields.ts`**: Field decorators (`fields.char()`, `fields.many2one()`, `fields.selection()`, etc.) use `Reflect.defineMetadata`.
- **`env.ts`**: `env(modelName)` returns a `ModelProxy` with `search()`/`browse()`/`create()`/`write()`/`unlink()`/`read()`. Table name derived as `model._table ?? model._name.replace(/\./g, '_')`.
- **`registry.ts`**: `ModelRegistry` singleton with `register()`/`get()`/`resolveInheritance()` (recursively merges parent-child field definitions).
- **`migration-diff.ts`**: `diffAndMigrate()` maps model field types to SQL columns and executes CREATE TABLE / ALTER TABLE via `knex.raw()`.

### @erp/core — Core Layer
- **`module-registry.ts`**: `ModuleRegistry` with `register()`/`resolveDependencies()` (topological sort with cycle detection via visiting/having sets). `ModuleDefinition` holds manifest, model classes, controller classes, data files.
- **`module-scanner.ts`**: `scanModules()` reads filesystem for `manifest.ts` + `index.ts` per module directory. `installModules()` registers each module's model classes into the domain model registry.
- **`security/`**: 6-layer security — ACL (model-level group permissions), Field Security (readable/writable field filtering), Record Rules (domain filtering with `$uid` placeholder), AES Encryption (crypto-js), Data Masking (phone/email/id_card), Audit Logging (auto-creating `audit_log` table).

### @erp/admin — Admin Shell
- **`store.ts`**: Zustand store (`AppState`) — `menuItems`, `activeMenuId`, `activeView`, `user`. SETTER-style actions. Store exposed on `window.__STORE__` for e2e testing.
- **`MenuRenderer.tsx`**: `buildTree()` converts flat `MenuItem[]` to recursive `TreeNode[]`. Sorted by `sequence` at all levels. Renders with expand/collapse toggle.
- **`ViewRenderer.tsx`**: Dispatches on `view.type` → `FormRenderer` / `TableRenderer` / `SearchPanel` / kanban placeholder / calendar placeholder.
- **`FormRenderer.tsx`**: Dynamic form with field-level widget dispatch (`TextWidget`, `SelectWidget`). Supports `tabs`/`grid`/`inline` layouts via `<fieldset>` groups.
- **`TableRenderer.tsx`**: Read-only table with "No records found" empty state.
- **`ErrorBoundary`** class component wrapping main content area in `App.tsx`.

## Module Pattern

Each module in `modules/` has:
```
modules/<name>/
├── manifest.ts       # { name, version, depends, auto_install, application }
├── index.ts          # exports: models[], views[], menus[], controllers[], security[]
├── models/           # Model classes with @model() + @fields.* decorators
├── views/            # ViewSpec objects (form/tree/search)
├── controllers/      # Controller classes with static routes[]
└── security/         # ACL rule arrays
```

The scanner reads `manifest.ts` for metadata and `index.ts` for the exported arrays. Currently only `models` and `controllers` are consumed by `installModules()`; `views`, `menus`, and `security` exports are defined but not yet consumed by the runtime (hookup pending).

## Key Conventions

- Table names: `model._table` if set, otherwise `model._name.replace(/\./g, '_')` (e.g. `res.partner` → `res_partner`)
- `reflect-metadata` must be imported before decorators execute (imported in `model.ts`)
- Knex client is `pg` (PostgreSQL). Connection is a module-level singleton.
- `tsconfig.base.json` enforces `strict: true`, `noUncheckedIndexedAccess: true`, `experimentalDecorators: true`
- Admin package has its own `jsx: "react-jsx"` setting; other packages compile via tsup
