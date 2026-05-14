# Agent ERP — Odoo-like ERP Framework Design Spec

**Date:** 2026-05-14
**Status:** Approved
**Goal:** Build a general-purpose ERP framework inspired by Odoo's architecture, using Node.js/TypeScript + React + PostgreSQL.

---

## 1. Project Overview

- **Purpose:** Custom ERP framework (general-purpose), modular and extensible, modeled after Odoo's core patterns.
- **MVP Scope:** Minimal kernel — module system, ORM, view engine, permission system, menu/navigation.
- **Tech Stack:** Node.js 18+ / TypeScript 5+ / Knex / PostgreSQL 15+ / React 18+ / pnpm workspace.

---

## 2. Architecture: Four-Layer Progressive

```
Presentation Layer  →  React Admin Shell, ViewRenderer, Menu
Application Layer   →  ModuleRegistry, Controllers, Auth, Cron, Workflows
Domain Layer        →  Model (ORM), ViewDefinition, Permission, Field Types, Inheritance
Data Layer          →  Knex (Query Builder + Migration), PostgreSQL
```

### 2.1 Package Layout

```
agent-erp/
├── packages/
│   ├── data/          # Knex wrapper: connection pool, migrations, SQL builder
│   ├── domain/        # ORM: Model, Field, env, inheritance, computed fields
│   ├── core/          # Application: ModuleRegistry, Controller, permission middleware, cron
│   └── admin/         # React Admin Shell: ViewRenderer, Menu, theme
├── modules/
│   └── base/          # Base module: Partner, Users, Settings (first business module)
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

### 2.2 Layer Responsibilities

| Layer | Responsibilities | Source |
|-------|-----------------|--------|
| Data | SQL generation, connection pool, migration management | packages/data/ |
| Domain | Model definition, ORM API, fields, inheritance, computed fields | packages/domain/ |
| Core | Module registration, routing, permission checking, cron scheduler | packages/core/ |
| Admin | React shell, view renderer, menu tree, dynamic component mapping | packages/admin/ |

---

## 3. Module System

### 3.1 Module Directory Convention

```
modules/{module_name}/
├── index.ts              # Module entry, exports ModuleDefinition
├── manifest.ts           # Metadata (name, version, depends, data files)
├── models/               # One file per Model
│   └── {model_name}.ts
├── views/                # ViewDefinition files: {model}.{type}.ts
├── controllers/          # HTTP route handlers
├── security/
│   ├── acl.ts            # Model-level CRUD permissions
│   └── rules.ts          # Record-level filter rules
├── data/                 # Seed / initial data
└── __tests__/            # Module-level tests
```

### 3.2 Module Lifecycle

```
depends → install → init → ready
```

- **Dependency resolution:** Topological sort, cyclic dependency detection.
- **Hot reload:** Dev mode watches file changes, reloads single module.
- **Inheritance:** `_inherit` supports cross-module Model and View extension.

### 3.3 ModuleDefinition Interface

```typescript
interface ModuleDefinition {
  name: string;
  version: string;
  depends: string[];
  models: ModelClass[];
  views: ViewDefinition[];
  menus: MenuItem[];
  controllers: ControllerClass[];
  security: SecurityDefinition;
  data: SeedData[];
}
```

---

## 4. ORM Design

### 4.1 Base Class Hierarchy

```
BaseModel (abstract)
├── Model          → Persistent, mapped to a database table
├── TransientModel → Temporary data (wizards), auto-expires
└── AbstractModel  → Pure mixin, no table created
```

### 4.2 Model Definition Example

```typescript
import { Model, fields, api } from '@erp/domain';

@model({ _name: 'sale.order', _description: 'Sales Order' })
class SaleOrder extends Model {
  @fields.char({ required: true, default: 'New' })
  name: string;

  @fields.many2one({ comodel: 'res.partner', required: true })
  partner_id: number;

  @fields.one2many({ comodel: 'sale.order.line', inverse_field: 'order_id' })
  order_line_ids: number[];

  @fields.selection([
    ['draft', 'Draft'],
    ['confirmed', 'Confirmed'],
    ['done', 'Done'],
    ['cancel', 'Cancelled'],
  ])
  state: string;

  @api.compute({ depends: ['order_line_ids.subtotal'] })
  amount_total(record) {
    return record.order_line_ids.reduce((sum, line) => sum + line.subtotal, 0);
  }
}
```

### 4.3 Field Types

| Category | Fields |
|----------|--------|
| Simple | Char, Text, Html, Integer, Float, Boolean, Date, Datetime, Binary, Selection |
| Relational | Many2one, One2many, Many2many, Reference |
| Advanced | Monetary, Image, Json, Computed, Related |

### 4.4 Inheritance

| Type | Mechanism | Use Case |
|------|-----------|----------|
| `_inherit` | Extend existing Model, same table, add fields/methods | Add `credit_limit` to `res.partner` |
| `_inherits` | Delegation via FK, transparent access to parent fields | Product → ProductTemplate |

### 4.5 Environment (`env`)

All ORM operations go through `env()` for automatic permission checking.

```typescript
const orders = await env('sale.order')
  .search([['state', '=', 'draft']])
  .withContext({ lang: 'zh_CN' });

await orders.write({ state: 'confirmed' });
```

### 4.6 Core ORM API

| Operation | Method |
|-----------|--------|
| Create | `env(model).create(vals)` |
| Search | `env(model).search(domain)` |
| Browse | `env(model).browse(ids)` |
| Write | `records.write(vals)` |
| Delete | `records.unlink()` |
| Read | `records.read(fields)` |

- **Underlying engine:** Knex handles SQL generation and schema migration.
- **Migration:** Auto-generated from Model definitions via a diff tool (not hand-written SQL).

---

## 5. View Engine

### 5.1 View Types

| Type | Purpose | React Renderer |
|------|---------|---------------|
| `form` | Single record create/edit | FormRenderer |
| `tree` | Table/list | TableRenderer |
| `search` | Search filter panel | SearchPanel |
| `kanban` | Kanban board | KanbanRenderer |
| `calendar` | Calendar view | CalendarRenderer |

### 5.2 View Definition Example (TypeScript, not XML)

```typescript
export const saleOrderForm: FormView = {
  model: 'sale.order',
  type: 'form',
  title: 'Sales Order',
  fields: [
    { name: 'name', widget: 'text', readonly: true },
    { name: 'partner_id', widget: 'select', required: true },
    { name: 'state', widget: 'status_bar' },
  ],
  layout: {
    type: 'tabs',
    items: [
      { title: 'Basic Info', fields: ['name', 'partner_id', 'date_order'] },
      { title: 'Order Lines', fields: ['order_line_ids'], widget: 'inline_tree' },
      { title: 'Other', fields: ['note', 'state'] },
    ],
  },
};
```

### 5.3 View Inheritance

```typescript
export const extendSaleForm: ViewExtension = {
  inherit: 'sale.order.form',
  insert: { after: 'partner_id', fields: ['credit_limit'] },
};
```

### 5.4 Render Pipeline

```
ViewDefinition → ViewRegistry collect → React ViewRenderer
→ Parse layout/fields → Map widgets → Render component tree
```

---

## 6. Permission System (6 Layers)

```
Layer 1: ACL (model-level)  →  Group → Model CRUD permissions
Layer 2: Field-level         →  Field visible/readonly/hidden per role
Layer 3: Record Rules        →  Row-level domain filtering
Layer 4: Field Encryption    →  AES-256 encryption at rest for sensitive fields
Layer 5: Data Masking        →  Auto-mask on read (e.g., 138****1234)
Layer 6: Audit Logging       →  All CUD operations auto-logged
```

### 6.1 Security Interceptor Chain

```
Request → Auth Guard → ACL Check → Field Filter → Record Rule Injection
→ [Write: Field Encrypt] → DB
→ [Read: Field Decrypt → Mask] → Response
```

### 6.2 Declarative Security Annotations

```typescript
@fields.char({ encrypt: true })           // Layer 4
phone: string;

@fields.char({ mask: 'phone' })           // Layer 5
phone: string;

// Layer 6: Automatic — writes to audit_log table:
// { timestamp, user_id, model, record_id, operation, old_values, new_values }
```

---

## 7. Menu & Navigation

```typescript
export const saleMenus: MenuItem[] = [
  {
    id: 'sale_root',
    name: 'Sales',
    sequence: 10,
    children: [
      { id: 'sale_order_menu', name: 'Sales Orders', action: 'sale.order.tree' },
      { id: 'sale_customer_menu', name: 'Customers', action: 'res.partner.tree' },
    ],
  },
];
```

- Recursive tree rendering in React `MenuRenderer`.
- Menu items auto-hidden when user lacks access to the linked action/model.

---

## 8. Request Lifecycle

```
HTTP Request
  → Router matches Controller + Route
  → Auth Middleware (authenticate, create user env)
  → ACL Middleware (model-level permission check)
  → Controller Method (calls Model methods)
  → Model Method (ORM via env())
  → env().search/write/create...
  → Record Rule Injection (row-level domain)
  → Field Filter (field-level visibility)
  → [Read: Decrypt + Mask] / [Write: Validate + Encrypt]
  → Knex → SQL → PostgreSQL
  → Audit Log (CUD → audit_log table)
  → JSON Response (tRPC type-safe serialization)
```

---

## 9. Tech Stack Detail

| Layer | Library | Rationale |
|-------|---------|-----------|
| Build | pnpm workspace + tsup | Fast, type-safe, monorepo native |
| Schema | Knex migrations + custom diff | Auto-generate migrations from Models |
| API | tRPC | End-to-end type safety |
| State | Zustand | Lightweight, manage ViewRegistry/Menu state |
| UI | Ant Design / Shadcn UI | Mature table/form/kanban components |
| View Render | Custom ViewRenderer | Reads ViewDefinition → renders components |
| Testing | Vitest + Playwright | Fast unit tests + E2E coverage |
| Task Queue | BullMQ + Redis | Cron jobs, async tasks |

---

## 10. Project Constraints (CLAUDE.md)

### Technical Constraints
- Backend: Node.js 18+ / TypeScript 5+ / Knex / PostgreSQL 15+
- Frontend: React 18+ / TypeScript / CSS Modules or Tailwind
- Package manager: pnpm workspace
- Testing: Vitest (backend), Playwright (frontend E2E)
- Style: ESLint + Prettier, `any` type forbidden (strict mode)

### Naming Conventions
- Module dir: `lowercase_underscore` (sale, purchase_order)
- Model class: PascalCase (SaleOrder)
- Model technical name: `lowercase.dotted` (sale.order)
- View file: `{model}.{type}.ts` (sale_order.form.ts)
- DB table name: auto-converted from `_name` (sale.order → sale_order)

### Design Principles
- One Model per file, max ~300 lines
- Business logic in Model methods, not Controllers
- View definitions and business logic kept separate
- Cross-module changes via `_inherit`, never directly edit other module source
- All ORM operations through `env()` to ensure permission checks
- Migrations auto-generated, no hand-written SQL

### Forbidden
- Direct DB access from Controllers
- Bypassing `env()` to call underlying Knex
- Hardcoded SQL
- Circular dependencies between modules

---

## 11. Agent Skills

| Skill | Purpose | Input |
|-------|---------|-------|
| `init-erp` | Initialize monorepo skeleton, install deps, configure tsconfig/workspace | — |
| `scaffold-module` | Scaffold a new module with full directory structure | module_name, depends |
| `create-model` | Create a Model class with fields, computed properties, constraints | Model name, field specs |
| `extend-model` | Extend an existing Model via `_inherit` | target model, additions |
| `create-view` | Create a ViewDefinition file | Model, view type, field layout |
| `extend-view` | Inject fields/components into existing view | target view, insert position, new fields |
| `create-controller` | Create HTTP Controller + route definition | module, route path, methods |
| `add-permission` | Configure ACL / field security / record rules / audit | target Model, permission spec |
| `run-migration` | Diff Model definitions against DB, auto-generate & run migration | module name |
| `create-test` | Generate test file template | test target, type |

---

## 12. Design Decisions Summary

| Topic | Decision |
|-------|----------|
| Layering | Data → Domain → Core → Admin |
| Module System | Directory-as-module, manifest declares deps, Registry manages all |
| ORM | Knex bottom layer + custom Model/Field/env API on top |
| Inheritance | `_inherit` (extension) + `_inherits` (delegation) |
| Views | TypeScript ViewDefinition, React dynamic rendering |
| Security | 6 layers: ACL → Field → Record Rules → Encryption → Masking → Audit |
| Menu | Registry + recursive tree render, auto permission filter |
| API | tRPC for end-to-end type safety |
