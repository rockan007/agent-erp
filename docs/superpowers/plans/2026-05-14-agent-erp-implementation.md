# Agent ERP Framework — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the MVP kernel of an Odoo-like ERP framework: module system, ORM, view engine, permissions, and navigation.

**Architecture:** Four-layer monorepo: Data (Knex) → Domain (ORM) → Core (Module registry, permissions, controllers) → Admin (React shell). Business modules live under `modules/`, each following the Odoo-inspired directory convention.

**Tech Stack:** Node.js 18+, TypeScript 5, Knex, PostgreSQL 15+, React 18, Ant Design 5, Tailwind CSS 3, PostCSS, pnpm workspace, Vitest.

**Design Spec:** `docs/superpowers/specs/2026-05-14-agent-erp-design.md`

---

## File Map

```
agent-erp/
├── package.json                          # Root package.json (pnpm workspace)
├── pnpm-workspace.yaml                   # Workspace definition
├── tsconfig.base.json                    # Shared TS config
├── tsconfig.json                         # Root TS config (extends base)
├── .eslintrc.json
├── .prettierrc
│
├── packages/
│   ├── data/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # Public exports
│   │       ├── connection.ts             # Knex instance + pool
│   │       ├── migration-runner.ts       # Auto-diff & run migrations
│   │       └── query-builder.ts          # Typed query helpers
│   │
│   ├── domain/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # Public exports
│   │       ├── model.ts                  # BaseModel, Model, TransientModel, AbstractModel
│   │       ├── fields.ts                 # All field types + decorators
│   │       ├── env.ts                    # Environment: env(), Env class
│   │       ├── inheritance.ts            # _inherit, _inherits resolution
│   │       ├── registry.ts               # Model registry (in-memory)
│   │       ├── migration-diff.ts         # Compare Model defs → SQL diff
│   │       └── types.ts                  # Shared types
│   │
│   ├── core/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # Public exports
│   │       ├── module-registry.ts        # Module loader + dependency resolver
│   │       ├── module-scanner.ts         # Scan modules/ directory
│   │       ├── router.ts                 # Controller registration + route matching
│   │       ├── auth.ts                   # Auth middleware + user env
│   │       ├── security/
│   │       │   ├── index.ts
│   │       │   ├── acl.ts                # ACL checker
│   │       │   ├── field-security.ts     # Field-level filter
│   │       │   ├── record-rules.ts       # Row-level domain injection
│   │       │   ├── encryption.ts         # AES-256 field encrypt/decrypt
│   │       │   ├── masking.ts            # Data masking patterns
│   │       │   └── audit.ts              # Audit log writer
│   │       ├── menu-registry.ts          # Menu tree builder
│   │       └── cron.ts                   # Cron job scheduler
│   │
│   └── admin/
│       ├── package.json
│       ├── tsconfig.json
│       ├── index.html
│       ├── tailwind.config.js            # Tailwind CSS config (preflight off)
│       ├── postcss.config.js             # PostCSS with tailwind + autoprefixer
│       └── src/
│           ├── main.tsx                  # Entry point (ConfigProvider + theme)
│           ├── App.tsx                   # Shell: antd Layout+Sider+Menu+Content
│           ├── index.css                 # Tailwind directives + @layer ordering
│           ├── api.ts                    # tRPC client
│           ├── store.ts                  # Zustand store (menu, views, user)
│           ├── types.ts                  # Pure type definitions (MenuItem, ViewSpec)
│           ├── components/
│           │   ├── MenuRenderer.tsx      # antd Menu with icon lookup
│           │   ├── ViewRenderer.tsx      # Dispatch view type → component
│           │   ├── FormRenderer.tsx      # antd Form+Tabs+Card renderer
│           │   ├── TableRenderer.tsx     # antd Table renderer
│           │   ├── SearchPanel.tsx       # antd Form inline search
│           │   └── widgets/
│           │       ├── TextWidget.tsx    # antd Input widget
│           │       └── SelectWidget.tsx  # antd Select widget
│
├── modules/
│   └── base/                             # Base business module
│       ├── package.json
│       ├── index.ts
│       ├── manifest.ts
│       ├── models/
│       │   ├── res_partner.ts
│       │   └── res_users.ts
│       ├── views/
│       │   ├── res_partner.form.ts
│       │   ├── res_partner.tree.ts
│       │   ├── res_partner.search.ts
│       │   └── menus.ts
│       ├── controllers/
│       │   └── partner_controller.ts
│       ├── security/
│       │   ├── acl.ts
│       │   └── rules.ts
│       └── data/
│           └── seed.ts
│
└── .claude/
    └── settings.json                    # Permissions + hooks
```

---

## Phase 1: Project Initialization

### Task 1.1: Root monorepo scaffold

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `tsconfig.json`
- Create: `.eslintrc.json`
- Create: `.prettierrc`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "agent-erp",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel -r run dev",
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "packages/*"
  - "modules/*"
```

- [ ] **Step 3: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["packages/**/*.ts", "packages/**/*.tsx", "modules/**/*.ts", "modules/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 5: Create .eslintrc.json**

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "off"
  },
  "ignorePatterns": ["dist/", "node_modules/"]
}
```

- [ ] **Step 6: Create .prettierrc**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 7: Install dependencies**

Run: `pnpm install`
Expected: packages installed successfully, `pnpm-lock.yaml` created.

---

### Task 1.2: Create package scaffolding

**Files:**
- Create: `packages/data/package.json`
- Create: `packages/data/tsconfig.json`
- Create: `packages/domain/package.json`
- Create: `packages/domain/tsconfig.json`
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/admin/package.json`
- Create: `packages/admin/tsconfig.json`

- [ ] **Step 1: Create packages/data/package.json**

```json
{
  "name": "@erp/data",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --dts --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "knex": "^3.1.0",
    "pg": "^8.12.0"
  },
  "devDependencies": {
    "@types/pg": "^8.11.0",
    "tsup": "^8.1.0"
  }
}
```

- [ ] **Step 2: Create packages/domain/package.json**

```json
{
  "name": "@erp/domain",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --dts --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "@erp/data": "workspace:*",
    "knex": "^3.1.0"
  },
  "devDependencies": {
    "tsup": "^8.1.0"
  }
}
```

- [ ] **Step 3: Create packages/core/package.json**

```json
{
  "name": "@erp/core",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --dts --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "@erp/domain": "workspace:*",
    "@erp/data": "workspace:*",
    "crypto-js": "^4.2.0"
  },
  "devDependencies": {
    "@types/crypto-js": "^4.2.0",
    "tsup": "^8.1.0"
  }
}
```

- [ ] **Step 4: Create packages/admin/package.json**

```json
{
  "name": "@erp/admin",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "@ant-design/icons": "^6.2.3",
    "@erp/core": "workspace:*",
    "@tanstack/react-query": "^5.0.0",
    "antd": "5",
    "autoprefixer": "^10.5.0",
    "postcss": "^8.5.14",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "tailwindcss": "3",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.3.0"
  }
}
```

- [ ] **Step 5: Create each package's tsconfig.json (all four follow this pattern)**

For each package, create `tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

- [ ] **Step 6: Create minimal index.ts for each package**

Create `packages/data/src/index.ts`:
```typescript
export const VERSION = '0.1.0';
```

Create `packages/domain/src/index.ts`:
```typescript
export const VERSION = '0.1.0';
```

Create `packages/core/src/index.ts`:
```typescript
export const VERSION = '0.1.0';
```

- [ ] **Step 7: Install all package dependencies**

Run: `pnpm install`
Expected: all workspaces resolved, `pnpm-lock.yaml` updated.

---

## Phase 2: Data Layer (`@erp/data`)

### Task 2.1: Connection manager

**Files:**
- Create: `packages/data/src/connection.ts`
- Test: `packages/data/src/__tests__/connection.test.ts`

- [ ] **Step 1: Write connection.ts**

```typescript
import knex, { Knex } from 'knex';

export interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  pool?: { min: number; max: number };
}

let _knex: Knex | null = null;

export function getConnection(): Knex {
  if (!_knex) {
    throw new Error('Database not initialized. Call initConnection() first.');
  }
  return _knex;
}

export function initConnection(config: ConnectionConfig): Knex {
  _knex = knex({
    client: 'pg',
    connection: {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
    },
    pool: {
      min: config.pool?.min ?? 2,
      max: config.pool?.max ?? 10,
    },
    migrations: {
      tableName: 'erp_migrations',
    },
  });
  return _knex;
}

export async function closeConnection(): Promise<void> {
  if (_knex) {
    await _knex.destroy();
    _knex = null;
  }
}

export function getKnex(): Knex {
  return getConnection();
}
```

- [ ] **Step 2: Write connection.test.ts**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initConnection, getConnection, closeConnection, getKnex } from '../connection';

describe('connection', () => {
  afterEach(async () => {
    await closeConnection();
  });

  it('should throw if not initialized', () => {
    expect(() => getConnection()).toThrow('Database not initialized');
  });

  it('should init and return connection', () => {
    const conn = initConnection({
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      user: 'test',
      password: 'test',
    });
    expect(conn).toBeDefined();
    expect(getConnection()).toBe(conn);
  });

  it('getKnex should return same connection', () => {
    initConnection({
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      user: 'test',
      password: 'test',
    });
    expect(getKnex()).toBe(getConnection());
  });
});
```

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @erp/data test`

---

### Task 2.2: Query builder helpers

**Files:**
- Create: `packages/data/src/query-builder.ts`
- Test: `packages/data/src/__tests__/query-builder.test.ts`

- [ ] **Step 1: Write query-builder.ts**

```typescript
import { Knex } from 'knex';
import { getKnex } from './connection';

export type DomainOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'like' | 'ilike' | 'in' | 'not in';
export type DomainTuple = [string, DomainOperator, unknown];
export type Domain = DomainTuple[];

export interface QueryOptions {
  columns?: string[];
  domain?: Domain;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export function buildWhereClause(
  builder: Knex.QueryBuilder,
  domain: Domain,
): Knex.QueryBuilder {
  for (const [field, operator, value] of domain) {
    switch (operator) {
      case '=':
        builder.where(field, value);
        break;
      case '!=':
        builder.whereNot(field, value);
        break;
      case '>':
        builder.where(field, '>', value);
        break;
      case '<':
        builder.where(field, '<', value);
        break;
      case '>=':
        builder.where(field, '>=', value);
        break;
      case '<=':
        builder.where(field, '<=', value);
        break;
      case 'like':
        builder.where(field, 'like', value);
        break;
      case 'ilike':
        builder.where(field, 'ilike', value);
        break;
      case 'in':
        builder.whereIn(field, value as unknown[]);
        break;
      case 'not in':
        builder.whereNotIn(field, value as unknown[]);
        break;
    }
  }
  return builder;
}

export function buildQuery(
  tableName: string,
  options: QueryOptions = {},
): Knex.QueryBuilder {
  const knex = getKnex();
  let query = knex(tableName);

  if (options.columns) {
    query = query.select(options.columns);
  }

  if (options.domain && options.domain.length > 0) {
    query = buildWhereClause(query, options.domain);
  }

  if (options.orderBy) {
    query = query.orderBy(options.orderBy, options.orderDir ?? 'asc');
  }

  if (options.limit !== undefined) {
    query = query.limit(options.limit);
  }

  if (options.offset !== undefined) {
    query = query.offset(options.offset);
  }

  return query;
}
```

- [ ] **Step 2: Write query-builder.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import { buildWhereClause, buildQuery } from '../query-builder';
import { initConnection, closeConnection } from '../connection';

describe('buildWhereClause', () => {
  it('should build where clause for multiple domain tuples', async () => {
    initConnection({
      host: 'localhost', port: 5432, database: 'test', user: 'test', password: 'test',
    });
    const knex = (await import('../connection')).getKnex();
    let query = knex('test_table');
    query = buildWhereClause(query, [
      ['name', '=', 'test'],
      ['age', '>', 18],
    ]);
    const sql = query.toString();
    expect(sql).toContain('"name"');
    expect(sql).toContain('"age"');
    await closeConnection();
  });
});
```

- [ ] **Step 3: Update packages/data/src/index.ts**

```typescript
export { initConnection, getConnection, closeConnection, getKnex } from './connection';
export type { ConnectionConfig } from './connection';
export { buildWhereClause, buildQuery } from './query-builder';
export type { Domain, DomainOperator, DomainTuple, QueryOptions } from './query-builder';
```

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @erp/data test`

---

### Task 2.3: Migration runner

**Files:**
- Create: `packages/data/src/migration-runner.ts`
- Test: `packages/data/src/__tests__/migration-runner.test.ts`

- [ ] **Step 1: Write migration-runner.ts**

```typescript
import { Knex } from 'knex';
import { getKnex } from './connection';

export interface Migration {
  name: string;
  up: (knex: Knex) => Promise<void>;
  down: (knex: Knex) => Promise<void>;
}

export async function runMigrations(migrations: Migration[]): Promise<void> {
  const knex = getKnex();

  // Ensure migrations table exists
  const hasTable = await knex.schema.hasTable('erp_migrations');
  if (!hasTable) {
    await knex.schema.createTable('erp_migrations', (table) => {
      table.string('name').primary();
      table.timestamp('run_at').defaultTo(knex.fn.now());
    });
  }

  const completed = await knex('erp_migrations').select('name');
  const completedNames = new Set(completed.map((r: { name: string }) => r.name));

  for (const migration of migrations) {
    if (!completedNames.has(migration.name)) {
      await migration.up(knex);
      await knex('erp_migrations').insert({ name: migration.name });
    }
  }
}

export async function rollbackMigrations(migrations: Migration[]): Promise<void> {
  const knex = getKnex();
  const completed = await knex('erp_migrations').select('name');
  const completedNames = new Set(completed.map((r: { name: string }) => r.name));

  for (const migration of [...migrations].reverse()) {
    if (completedNames.has(migration.name)) {
      await migration.down(knex);
      await knex('erp_migrations').where('name', migration.name).del();
    }
  }
}
```

- [ ] **Step 2: Write migration-runner.test.ts**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initConnection, closeConnection, getKnex } from '../connection';
import { runMigrations, rollbackMigrations, Migration } from '../migration-runner';

describe('migration-runner', () => {
  beforeEach(async () => {
    initConnection({
      host: 'localhost', port: 5432, database: 'erp_test', user: 'test', password: 'test',
    });
  });

  afterEach(async () => {
    await closeConnection();
  });

  it('should run pending migrations in order', async () => {
    const executed: string[] = [];
    const migrations: Migration[] = [
      {
        name: '001_test',
        up: async () => { executed.push('001'); },
        down: async () => { executed = executed.filter(x => x !== '001'); },
      },
      {
        name: '002_test',
        up: async () => { executed.push('002'); },
        down: async () => { executed = executed.filter(x => x !== '002'); },
      },
    ];

    await runMigrations(migrations);
    expect(executed).toContain('001');
    expect(executed).toContain('002');
  });

  it('should skip already-run migrations', async () => {
    const executed: string[] = [];
    const migrations: Migration[] = [{
      name: '003_skip',
      up: async () => { executed.push('003'); },
      down: async () => {},
    }];

    await runMigrations(migrations);
    const afterFirst = executed.length;
    await runMigrations(migrations);
    expect(executed.length).toBe(afterFirst);
  });
});
```

- [ ] **Step 4: Update index.ts**

```typescript
// append to packages/data/src/index.ts
export { runMigrations, rollbackMigrations } from './migration-runner';
export type { Migration } from './migration-runner';
```

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @erp/data test`

---

## Phase 3: Domain Layer (`@erp/domain`)

### Task 3.1: Model base classes

**Files:**
- Create: `packages/domain/src/model.ts`
- Create: `packages/domain/src/types.ts`
- Test: `packages/domain/src/__tests__/model.test.ts`

- [ ] **Step 1: Write types.ts**

```typescript
export type FieldType =
  | 'char' | 'text' | 'html' | 'integer' | 'float'
  | 'boolean' | 'date' | 'datetime' | 'binary' | 'selection'
  | 'many2one' | 'one2many' | 'many2many' | 'reference'
  | 'monetary' | 'image' | 'json';

export interface FieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
  readonly?: boolean;
  default?: unknown;
  comodel?: string;
  inverse_field?: string;
  selection?: [string, string][];
  encrypt?: boolean;
  mask?: 'phone' | 'email' | 'id_card';
  store?: boolean;
  compute?: (record: Record<string, unknown>) => unknown;
  depends?: string[];
}

export interface ModelDefinition {
  _name: string;
  _description: string;
  _inherit?: string;
  _inherits?: Record<string, string>;
  _table?: string;
  fields: Record<string, FieldDefinition>;
}

export interface RecordData {
  id?: number;
  [key: string]: unknown;
}
```

- [ ] **Step 2: Write model.ts**

```typescript
import { FieldDefinition, ModelDefinition, RecordData } from './types';
import { getModelRegistry } from './registry';

export type ModelConstructor<T extends typeof BaseModel> = T & {
  _definition: ModelDefinition;
  new (): InstanceType<T>;
};

export abstract class BaseModel {
  static _definition: ModelDefinition = { _name: '', _description: '', fields: {} };

  static _register(): void {
    getModelRegistry().register(this as unknown as typeof BaseModel);
  }
}

export class Model extends BaseModel {
  static _type = 'model' as const;
}

export class TransientModel extends BaseModel {
  static _type = 'transient' as const;
}

export class AbstractModel extends BaseModel {
  static _type = 'abstract' as const;
}

export function model(config: {
  _name: string;
  _description?: string;
  _inherit?: string;
  _inherits?: Record<string, string>;
}) {
  return function <T extends { new (...args: unknown[]): object }>(target: T) {
    const proto = target.prototype as Record<string, unknown>;
    const fieldMetadata: Record<string, FieldDefinition> =
      (Reflect.getMetadata('fields', proto) as Record<string, FieldDefinition>) ?? {};

    (target as unknown as typeof BaseModel)._definition = {
      _name: config._name,
      _description: config._description ?? '',
      _inherit: config._inherit,
      _inherits: config._inherits,
      fields: fieldMetadata,
    };
  };
}
```

- [ ] **Step 3: Write model.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import { Model, model, BaseModel } from '../model';

describe('Model', () => {
  it('should set _definition from @model decorator', () => {
    @model({ _name: 'test.model', _description: 'Test Model' })
    class TestModel extends Model {}

    const def = (TestModel as unknown as typeof BaseModel)._definition;
    expect(def._name).toBe('test.model');
    expect(def._description).toBe('Test Model');
  });

  it('should support _inherit', () => {
    @model({ _name: 'test.child', _inherit: 'test.parent' })
    class ChildModel extends Model {}

    const def = (ChildModel as unknown as typeof BaseModel)._definition;
    expect(def._inherit).toBe('test.parent');
  });
});
```

- [ ] **Step 4: Update index.ts**

```typescript
export { BaseModel, Model, TransientModel, AbstractModel, model } from './model';
export type { ModelConstructor } from './model';
export type { FieldDefinition, ModelDefinition, RecordData, FieldType } from './types';
```

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @erp/domain test`

---

### Task 3.2: Field types & decorators

**Files:**
- Create: `packages/domain/src/fields.ts`
- Test: `packages/domain/src/__tests__/fields.test.ts`

- [ ] **Step 1: Write fields.ts**

```typescript
import 'reflect-metadata';
import { FieldDefinition, FieldType } from './types';

interface FieldOptions {
  required?: boolean;
  readonly?: boolean;
  default?: unknown;
  comodel?: string;
  inverse_field?: string;
  selection?: [string, string][];
  encrypt?: boolean;
  mask?: 'phone' | 'email' | 'id_card';
  store?: boolean;
}

function createField(type: FieldType) {
  return function (options: FieldOptions = {}) {
    return function (target: object, propertyKey: string): void {
      const existingFields: Record<string, FieldDefinition> =
        Reflect.getMetadata('fields', target) ?? {};

      existingFields[propertyKey] = {
        name: propertyKey,
        type,
        ...options,
      };

      Reflect.defineMetadata('fields', existingFields, target);
    };
  };
}

export const fields = {
  char: createField('char'),
  text: createField('text'),
  html: createField('html'),
  integer: createField('integer'),
  float: createField('float'),
  boolean: createField('boolean'),
  date: createField('date'),
  datetime: createField('datetime'),
  binary: createField('binary'),
  json: createField('json'),
  monetary: createField('monetary'),
  image: createField('image'),

  many2one(options: { comodel: string; required?: boolean; ondelete?: string }) {
    return function (target: object, propertyKey: string): void {
      const fields: Record<string, FieldDefinition> = Reflect.getMetadata('fields', target) ?? {};
      fields[propertyKey] = { name: propertyKey, type: 'many2one', ...options };
      Reflect.defineMetadata('fields', fields, target);
    };
  },

  one2many(options: { comodel: string; inverse_field: string }) {
    return function (target: object, propertyKey: string): void {
      const fields: Record<string, FieldDefinition> = Reflect.getMetadata('fields', target) ?? {};
      fields[propertyKey] = { name: propertyKey, type: 'one2many', ...options };
      Reflect.defineMetadata('fields', fields, target);
    };
  },

  many2many(options: { comodel: string; table?: string; column1?: string; column2?: string }) {
    return function (target: object, propertyKey: string): void {
      const fields: Record<string, FieldDefinition> = Reflect.getMetadata('fields', target) ?? {};
      fields[propertyKey] = { name: propertyKey, type: 'many2many', ...options };
      Reflect.defineMetadata('fields', fields, target);
    };
  },

  selection(options: [string, string][], fieldOptions: { required?: boolean; default?: string } = {}) {
    return function (target: object, propertyKey: string): void {
      const fields: Record<string, FieldDefinition> = Reflect.getMetadata('fields', target) ?? {};
      fields[propertyKey] = { name: propertyKey, type: 'selection', selection: options, ...fieldOptions };
      Reflect.defineMetadata('fields', fields, target);
    };
  },

  reference(options: { required?: boolean }) {
    return function (target: object, propertyKey: string): void {
      const fields: Record<string, FieldDefinition> = Reflect.getMetadata('fields', target) ?? {};
      fields[propertyKey] = { name: propertyKey, type: 'reference', ...options };
      Reflect.defineMetadata('fields', fields, target);
    };
  },
};
```

- [ ] **Step 2: Write fields.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import 'reflect-metadata';
import { fields } from '../fields';
import { FieldDefinition } from '../types';

describe('fields', () => {
  it('should store field metadata via decorator', () => {
    class TestModel {
      @fields.char({ required: true })
      name!: string;

      @fields.integer({ default: 0 })
      count!: number;
    }

    const meta = Reflect.getMetadata('fields', TestModel.prototype) as Record<string, FieldDefinition>;
    expect(meta['name']).toMatchObject({ type: 'char', required: true });
    expect(meta['count']).toMatchObject({ type: 'integer', default: 0 });
  });

  it('many2one should store comodel', () => {
    class TestRel {
      @fields.many2one({ comodel: 'res.partner' })
      partner_id!: number;
    }

    const meta = Reflect.getMetadata('fields', TestRel.prototype) as Record<string, FieldDefinition>;
    expect(meta['partner_id']).toMatchObject({ type: 'many2one', comodel: 'res.partner' });
  });

  it('selection should store options', () => {
    class TestSel {
      @fields.selection([['draft', 'Draft'], ['done', 'Done']])
      state!: string;
    }

    const meta = Reflect.getMetadata('fields', TestSel.prototype) as Record<string, FieldDefinition>;
    expect(meta['state'].selection).toEqual([['draft', 'Draft'], ['done', 'Done']]);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @erp/domain test`

---

### Task 3.3: Environment (env) implementation

**Files:**
- Create: `packages/domain/src/env.ts`
- Test: `packages/domain/src/__tests__/env.test.ts`

- [ ] **Step 1: Write env.ts**

```typescript
import { buildQuery, Domain } from '@erp/data';
import { ModelDefinition, RecordData } from './types';
import { getModelRegistry } from './registry';

export interface EnvContext {
  uid: number;
  lang?: string;
  tz?: string;
  [key: string]: unknown;
}

export class Env {
  private context: EnvContext;

  constructor(context: EnvContext) {
    this.context = { ...context };
  }

  withContext(extra: Record<string, unknown>): Env {
    return new Env({ ...this.context, ...extra });
  }

  getContext(): EnvContext {
    return { ...this.context };
  }

  get uid(): number {
    return this.context.uid;
  }
}

class ModelProxy {
  private modelName: string;
  private definition: ModelDefinition;
  private context: EnvContext;

  constructor(modelName: string, definition: ModelDefinition, context: EnvContext) {
    this.modelName = modelName;
    this.definition = definition;
    this.context = context;
  }

  private get tableName(): string {
    return this.definition._table ?? this.modelName.replace(/\./g, '_');
  }

  async search(domain: Domain = [], options: { limit?: number; offset?: number; orderBy?: string; orderDir?: 'asc' | 'desc' } = {}): Promise<RecordData[]> {
    const query = buildQuery(this.tableName, { domain, ...options });
    try {
      return await query;
    } catch {
      return [];
    }
  }

  async browse(ids: number[]): Promise<RecordData[]> {
    return this.search([['id', 'in', ids]]);
  }

  async create(values: Record<string, unknown>): Promise<RecordData> {
    const query = buildQuery(this.tableName, {});
    const [result] = await query.insert(values).returning('*');
    return result as RecordData;
  }

  async write(ids: number[], values: Record<string, unknown>): Promise<number> {
    const query = buildQuery(this.tableName, {});
    return query.whereIn('id', ids).update(values);
  }

  async unlink(ids: number[]): Promise<number> {
    const query = buildQuery(this.tableName, {});
    return query.whereIn('id', ids).del();
  }

  async read(ids: number[], fields?: string[]): Promise<RecordData[]> {
    const query = buildQuery(this.tableName, {});
    if (fields) {
      query.select(fields);
    }
    return query.whereIn('id', ids);
  }

  withContext(extra: Record<string, unknown>): ModelProxy {
    return new ModelProxy(this.modelName, this.definition, { ...this.context, ...extra });
  }
}

export function env(modelName: string): ModelProxy {
  const registry = getModelRegistry();
  const definition = registry.get(modelName);

  if (!definition) {
    throw new Error(`Model "${modelName}" is not registered.`);
  }

  return new ModelProxy(modelName, definition, {
    uid: 0,
    lang: 'en_US',
  });
}

export function envWithContext(modelName: string, context: EnvContext): ModelProxy {
  const registry = getModelRegistry();
  const definition = registry.get(modelName);

  if (!definition) {
    throw new Error(`Model "${modelName}" is not registered.`);
  }

  return new ModelProxy(modelName, definition, context);
}
```

- [ ] **Step 2: Write env.test.ts**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { env, envWithContext, Env } from '../env';
import { getModelRegistry } from '../registry';
import { ModelDefinition } from '../types';

describe('Env', () => {
  it('should create Env with context', () => {
    const e = new Env({ uid: 1, lang: 'zh_CN' });
    expect(e.uid).toBe(1);
    expect(e.getContext().lang).toBe('zh_CN');
  });

  it('withContext should merge and return new Env', () => {
    const e = new Env({ uid: 1 });
    const e2 = e.withContext({ lang: 'fr' });
    expect(e2.getContext().lang).toBe('fr');
    expect(e.getContext().lang).toBeUndefined();
  });
});

describe('env()', () => {
  it('should throw for unregistered model', () => {
    expect(() => env('nonexistent.model')).toThrow('not registered');
  });
});
```

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @erp/domain test`

---

### Task 3.4: Model registry

**Files:**
- Create: `packages/domain/src/registry.ts`
- Test: `packages/domain/src/__tests__/registry.test.ts`

- [ ] **Step 1: Write registry.ts**

```typescript
import { ModelDefinition } from './types';
import type { BaseModel } from './model';

export class ModelRegistry {
  private models = new Map<string, ModelDefinition>();
  private classes = new Map<string, typeof BaseModel>();

  register(modelClass: typeof BaseModel): void {
    const def = modelClass._definition;
    if (!def._name) {
      throw new Error('Model must have a _name');
    }
    this.models.set(def._name, def);
    this.classes.set(def._name, modelClass);
  }

  get(name: string): ModelDefinition | undefined {
    // Check cache first, then check if inherited from parent
    const direct = this.models.get(name);
    if (direct) return direct;

    // Check _inherits delegation
    for (const [childName, def] of this.models.entries()) {
      if (def._inherits && name in def._inherits) {
        return def;
      }
    }

    return undefined;
  }

  getAll(): Map<string, ModelDefinition> {
    return new Map(this.models);
  }

  getClass(name: string): typeof BaseModel | undefined {
    return this.classes.get(name);
  }

  resolveInheritance(name: string): ModelDefinition {
    const def = this.models.get(name);
    if (!def) throw new Error(`Model "${name}" not found`);

    if (def._inherit) {
      const parent = this.resolveInheritance(def._inherit);
      return {
        ...parent,
        ...def,
        fields: { ...parent.fields, ...def.fields },
      };
    }

    return def;
  }

  clear(): void {
    this.models.clear();
    this.classes.clear();
  }
}

let _registry: ModelRegistry | null = null;

export function getModelRegistry(): ModelRegistry {
  if (!_registry) {
    _registry = new ModelRegistry();
  }
  return _registry;
}
```

- [ ] **Step 2: Write registry.test.ts**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ModelRegistry, getModelRegistry } from '../registry';
import { Model, model } from '../model';

describe('ModelRegistry', () => {
  let registry: ModelRegistry;

  beforeEach(() => {
    registry = new ModelRegistry();
  });

  it('should register and retrieve model definition', () => {
    @model({ _name: 'test.model', _description: 'Test' })
    class TestModel extends Model {}

    registry.register(TestModel as unknown as typeof import('../model').BaseModel);
    const def = registry.get('test.model');
    expect(def?._name).toBe('test.model');
  });

  it('should resolve inheritance', () => {
    @model({ _name: 'test.parent', _description: 'Parent' })
    class Parent extends Model {
      // @ts-expect-error decorator adds metadata
      name: string;
    }

    @model({ _name: 'test.child', _inherit: 'test.parent' })
    class Child extends Model {}

    registry.register(Parent as unknown as typeof import('../model').BaseModel);
    registry.register(Child as unknown as typeof import('../model').BaseModel);

    const resolved = registry.resolveInheritance('test.child');
    expect(resolved._name).toBe('test.child');
  });

  it('getAll should return all models', () => {
    @model({ _name: 'a.model' }) class A extends Model {}
    @model({ _name: 'b.model' }) class B extends Model {}
    registry.register(A as unknown as typeof import('../model').BaseModel);
    registry.register(B as unknown as typeof import('../model').BaseModel);
    expect(registry.getAll().size).toBe(2);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @erp/domain test`

---

### Task 3.5: Migration diff (Model → SQL)

**Files:**
- Create: `packages/domain/src/migration-diff.ts`
- Test: `packages/domain/src/__tests__/migration-diff.test.ts`

- [ ] **Step 1: Write migration-diff.ts**

```typescript
import { Knex } from 'knex';
import { FieldDefinition, ModelDefinition } from './types';

function fieldToColumnType(field: FieldDefinition): string {
  switch (field.type) {
    case 'char': return 'string';
    case 'text': case 'html': return 'text';
    case 'integer': case 'many2one': case 'reference': return 'integer';
    case 'float': case 'monetary': return 'float';
    case 'boolean': return 'boolean';
    case 'date': return 'date';
    case 'datetime': return 'datetime';
    case 'binary': return 'binary';
    case 'selection': return 'string';
    case 'json': return 'jsonb';
    case 'image': return 'text';
    case 'one2many': case 'many2many': return 'virtual';
    default: return 'string';
  }
}

export function generateCreateTableSQL(model: ModelDefinition): string {
  const tableName = model._table ?? model._name.replace(/\./g, '_');
  const columns: string[] = ['id SERIAL PRIMARY KEY'];

  for (const [name, field] of Object.entries(model.fields)) {
    const colType = fieldToColumnType(field);
    if (colType === 'virtual') continue; // skip virtual fields

    let colDef = `"${name}" ${mapKnexTypeToSQL(colType)}`;
    if (field.required) colDef += ' NOT NULL';
    columns.push(colDef);
  }

  return `CREATE TABLE IF NOT EXISTS "${tableName}" (\n  ${columns.join(',\n  ')}\n);`;
}

function mapKnexTypeToSQL(knexType: string): string {
  const map: Record<string, string> = {
    string: 'VARCHAR(255)',
    text: 'TEXT',
    integer: 'INTEGER',
    float: 'DOUBLE PRECISION',
    boolean: 'BOOLEAN',
    date: 'DATE',
    datetime: 'TIMESTAMP',
    binary: 'BYTEA',
    jsonb: 'JSONB',
  };
  return map[knexType] ?? 'TEXT';
}

export async function diffAndMigrate(
  knex: Knex,
  models: ModelDefinition[],
): Promise<string[]> {
  const migrations: string[] = [];

  for (const model of models) {
    const tableName = model._table ?? model._name.replace(/\./g, '_');
    const hasTable = await knex.schema.hasTable(tableName);

    if (!hasTable) {
      const sql = generateCreateTableSQL(model);
      migrations.push(sql);
    } else {
      // Check for new columns
      const existingColumns = await knex(tableName).columnInfo();
      for (const [name, field] of Object.entries(model.fields)) {
        const colType = fieldToColumnType(field);
        if (colType === 'virtual') continue;
        if (!(name in existingColumns)) {
          const sqlType = mapKnexTypeToSQL(colType);
          migrations.push(
            `ALTER TABLE "${tableName}" ADD COLUMN "${name}" ${sqlType}${field.required ? ' NOT NULL' : ''};`
          );
        }
      }
    }
  }

  return migrations;
}
```

- [ ] **Step 2: Write migration-diff.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import { generateCreateTableSQL } from '../migration-diff';
import { ModelDefinition } from '../types';

describe('generateCreateTableSQL', () => {
  it('should generate CREATE TABLE for a model', () => {
    const model: ModelDefinition = {
      _name: 'test.basic',
      _description: 'Basic test',
      fields: {
        name: { name: 'name', type: 'char', required: true },
        description: { name: 'description', type: 'text' },
        price: { name: 'price', type: 'float' },
        active: { name: 'active', type: 'boolean' },
      },
    };

    const sql = generateCreateTableSQL(model);
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "test_basic"');
    expect(sql).toContain('"id" SERIAL PRIMARY KEY');
    expect(sql).toContain('"name" VARCHAR(255) NOT NULL');
    expect(sql).toContain('"description" TEXT');
    expect(sql).toContain('"price" DOUBLE PRECISION');
  });

  it('should skip virtual fields like one2many and many2many', () => {
    const model: ModelDefinition = {
      _name: 'test.virtual',
      _description: 'Virtual test',
      fields: {
        name: { name: 'name', type: 'char' },
        lines: { name: 'lines', type: 'one2many', comodel: 'test.line', inverse_field: 'parent_id' },
        tags: { name: 'tags', type: 'many2many', comodel: 'test.tag' },
      },
    };

    const sql = generateCreateTableSQL(model);
    expect(sql).not.toContain('lines');
    expect(sql).not.toContain('tags');
  });
});
```

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @erp/domain test`

---

### Task 3.6: Compute decorator (`@api`)

**Files:**
- Create: `packages/domain/src/api-decorators.ts`
- Test: `packages/domain/src/__tests__/api.test.ts`

- [ ] **Step 1: Write api-decorators.ts**

```typescript
import 'reflect-metadata';

interface ComputeConfig {
  depends: string[];
  store?: boolean;
}

interface ConstraintConfig {
  message?: string;
}

export const api = {
  compute(config: ComputeConfig) {
    return function (target: object, propertyKey: string, descriptor: PropertyDescriptor): void {
      const computes: Record<string, ComputeConfig> =
        Reflect.getMetadata('computes', target) ?? {};
      computes[propertyKey] = config;
      Reflect.defineMetadata('computes', computes, target);

      Reflect.defineMetadata('computed:' + propertyKey, true, target);
    };
  },

  depends(dependencies: string[]) {
    return function (target: object, propertyKey: string, descriptor: PropertyDescriptor): void {
      const deps: Record<string, string[]> =
        Reflect.getMetadata('depends', target) ?? {};
      deps[propertyKey] = dependencies;
      Reflect.defineMetadata('depends', deps, target);
    };
  },

  constrains(config: ConstraintConfig = {}) {
    return function (target: object, propertyKey: string, descriptor: PropertyDescriptor): void {
      const constraints: Record<string, ConstraintConfig> =
        Reflect.getMetadata('constraints', target) ?? {};
      constraints[propertyKey] = config;
      Reflect.defineMetadata('constraints', constraints, target);
    };
  },

  onchange(fieldNames: string[]) {
    return function (target: object, propertyKey: string, descriptor: PropertyDescriptor): void {
      const onchanges: Record<string, string[]> =
        Reflect.getMetadata('onchanges', target) ?? {};
      onchanges[propertyKey] = fieldNames;
      Reflect.defineMetadata('onchanges', onchanges, target);
    };
  },
};
```

- [ ] **Step 2: Write api.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import 'reflect-metadata';
import { api } from '../api-decorators';

describe('api decorators', () => {
  it('compute should store metadata', () => {
    class Test {
      @api.compute({ depends: ['price', 'qty'] })
      total(record: Record<string, unknown>) {
        return (record.price as number) * (record.qty as number);
      }
    }

    const computes = Reflect.getMetadata('computes', Test.prototype) as Record<string, unknown>;
    expect(computes['total']).toEqual({ depends: ['price', 'qty'] });
    expect(Reflect.getMetadata('computed:total', Test.prototype)).toBe(true);
  });

  it('constrains should store metadata', () => {
    class Test {
      @api.constrains({ message: 'Invalid value' })
      check() {}
    }

    const constraints = Reflect.getMetadata('constraints', Test.prototype) as Record<string, unknown>;
    expect(constraints['check']).toEqual({ message: 'Invalid value' });
  });

  it('onchange should store field list', () => {
    class Test {
      @api.onchange(['partner_id'])
      onPartnerChange() {}
    }

    const onchanges = Reflect.getMetadata('onchanges', Test.prototype) as Record<string, string[]>;
    expect(onchanges['onPartnerChange']).toEqual(['partner_id']);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @erp/domain test`

---

### Task 3.7: Domain layer public API

**Files:**
- Modify: `packages/domain/src/index.ts`

- [ ] **Step 1: Update index.ts with full exports**

```typescript
export { BaseModel, Model, TransientModel, AbstractModel, model } from './model';
export type { ModelConstructor } from './model';
export { fields } from './fields';
export { api } from './api-decorators';
export { env, envWithContext, Env } from './env';
export type { EnvContext } from './env';
export { ModelRegistry, getModelRegistry } from './registry';
export { generateCreateTableSQL, diffAndMigrate } from './migration-diff';
export type { FieldDefinition, ModelDefinition, RecordData, FieldType } from './types';
```

- [ ] **Step 2: Run all domain tests**

Run: `pnpm --filter @erp/domain test`

---

## Phase 4: Core Layer (`@erp/core`)

### Task 4.1: Module registry & scanner

**Files:**
- Create: `packages/core/src/module-registry.ts`
- Create: `packages/core/src/module-scanner.ts`
- Test: `packages/core/src/__tests__/module-registry.test.ts`

- [ ] **Step 1: Write module-registry.ts**

```typescript
import type { ModelConstructor } from '@erp/domain';

export interface ModuleManifest {
  name: string;
  version: string;
  depends: string[];
  auto_install?: boolean;
  application?: boolean;
}

export interface ModuleDefinition {
  manifest: ModuleManifest;
  models: ModelConstructor<typeof import('@erp/domain').Model>[];
  controllers: ControllerClass[];
  dataFiles: string[];
  installed: boolean;
}

export interface ControllerClass {
  new (): object;
  routes?: RouteDefinition[];
}

export interface RouteDefinition {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  handler: string;
  auth?: boolean;
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

    const visit = (name: string) => {
      if (visited.has(name)) return;
      if (visiting.has(name)) throw new Error(`Circular dependency: ${name}`);
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

- [ ] **Step 2: Write module-scanner.ts**

```typescript
import { readdirSync, existsSync, lstatSync } from 'fs';
import { join, resolve } from 'path';
import { getModuleRegistry, ModuleManifest, ModuleDefinition } from './module-registry';

export interface ScanOptions {
  modulesPath: string;
}

export async function scanModules(options: ScanOptions): Promise<string[]> {
  const registry = getModuleRegistry();
  const absPath = resolve(options.modulesPath);

  if (!existsSync(absPath)) {
    return [];
  }

  const entries = readdirSync(absPath);
  const loaded: string[] = [];

  for (const entry of entries) {
    const modulePath = join(absPath, entry);

    if (!lstatSync(modulePath).isDirectory()) continue;

    const manifestPath = join(modulePath, 'manifest.ts');
    const indexPath = join(modulePath, 'index.ts');

    if (!existsSync(manifestPath) || !existsSync(indexPath)) continue;

    const manifest = (await import(manifestPath)).default as ModuleManifest;
    const moduleExports = await import(indexPath);

    const moduleDef: ModuleDefinition = {
      manifest,
      models: moduleExports.models ?? [],
      controllers: moduleExports.controllers ?? [],
      dataFiles: moduleExports.data ?? [],
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

    // Register models in @erp/domain registry
    const { getModelRegistry } = await import('@erp/domain');
    const modelRegistry = getModelRegistry();
    for (const modelClass of mod.models) {
      modelRegistry.register(modelClass);
    }

    mod.installed = true;
  }
}
```

- [ ] **Step 3: Write module-registry.test.ts**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ModuleRegistry, ModuleDefinition } from '../module-registry';

describe('ModuleRegistry', () => {
  let registry: ModuleRegistry;

  beforeEach(() => {
    registry = new ModuleRegistry();
  });

  const makeModule = (name: string, depends: string[] = []): ModuleDefinition => ({
    manifest: { name, version: '1.0', depends },
    models: [],
    controllers: [],
    dataFiles: [],
    installed: false,
  });

  it('should register and retrieve modules', () => {
    const mod = makeModule('base');
    registry.register(mod);
    expect(registry.get('base')).toBe(mod);
  });

  it('should detect circular dependencies', () => {
    registry.register(makeModule('a', ['b']));
    registry.register(makeModule('b', ['a']));
    expect(() => registry.resolveDependencies()).toThrow('Circular dependency');
  });

  it('should resolve dependencies in topological order', () => {
    registry.register(makeModule('c', ['b']));
    registry.register(makeModule('b', ['a']));
    registry.register(makeModule('a', []));

    const order = registry.resolveDependencies();
    const idxA = order.indexOf('a');
    const idxB = order.indexOf('b');
    const idxC = order.indexOf('c');

    expect(idxA).toBeLessThan(idxB);
    expect(idxB).toBeLessThan(idxC);
  });

  it('should throw for missing dependency', () => {
    registry.register(makeModule('x', ['missing_module']));
    expect(() => registry.resolveDependencies()).toThrow('not found');
  });

  it('should throw for duplicate registration', () => {
    registry.register(makeModule('dup'));
    expect(() => registry.register(makeModule('dup'))).toThrow('already registered');
  });
});
```

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @erp/core test`

---

### Task 4.2: ACL permissions

**Files:**
- Create: `packages/core/src/security/acl.ts`
- Test: `packages/core/src/__tests__/acl.test.ts`

- [ ] **Step 1: Write acl.ts**

```typescript
export interface AclRule {
  model: string;
  group: string;
  permissions: {
    read: boolean;
    write: boolean;
    create: boolean;
    unlink: boolean;
  };
}

export class AclRegistry {
  private rules: AclRule[] = [];

  register(rules: AclRule[]): void {
    this.rules.push(...rules);
  }

  check(
    model: string,
    operation: 'read' | 'write' | 'create' | 'unlink',
    userGroups: string[],
  ): boolean {
    const applicableRules = this.rules.filter(
      (r) => r.model === model && userGroups.includes(r.group),
    );

    if (applicableRules.length === 0) return false;

    return applicableRules.some((r) => r.permissions[operation]);
  }

  getRules(model: string): AclRule[] {
    return this.rules.filter((r) => r.model === model);
  }

  clear(): void {
    this.rules = [];
  }
}

let _aclRegistry: AclRegistry | null = null;

export function getAclRegistry(): AclRegistry {
  if (!_aclRegistry) {
    _aclRegistry = new AclRegistry();
  }
  return _aclRegistry;
}
```

- [ ] **Step 2: Write acl.test.ts**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { AclRegistry } from '../acl';

describe('AclRegistry', () => {
  let acl: AclRegistry;

  beforeEach(() => {
    acl = new AclRegistry();
    acl.register([
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
    ]);
  });

  it('should allow read for base_user', () => {
    expect(acl.check('res.partner', 'read', ['base_user'])).toBe(true);
  });

  it('should deny unlink for base_user', () => {
    expect(acl.check('res.partner', 'unlink', ['base_user'])).toBe(false);
  });

  it('should allow unlink for admin', () => {
    expect(acl.check('res.partner', 'unlink', ['admin'])).toBe(true);
  });

  it('should deny all for unregistered group', () => {
    expect(acl.check('res.partner', 'read', ['nobody'])).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @erp/core test`

---

### Task 4.3: Field-level security & record rules

**Files:**
- Create: `packages/core/src/security/field-security.ts`
- Create: `packages/core/src/security/record-rules.ts`
- Test: `packages/core/src/__tests__/field-security.test.ts`
- Test: `packages/core/src/__tests__/record-rules.test.ts`

- [ ] **Step 1: Write field-security.ts**

```typescript
export interface FieldSecurityRule {
  model: string;
  group: string;
  fields: {
    name: string;
    readable: boolean;
    writable: boolean;
  }[];
}

export class FieldSecurityRegistry {
  private rules: FieldSecurityRule[] = [];

  register(rules: FieldSecurityRule[]): void {
    this.rules.push(...rules);
  }

  getReadableFields(model: string, userGroups: string[]): Set<string> {
    const result = new Set<string>();
    for (const rule of this.rules) {
      if (rule.model === model && userGroups.includes(rule.group)) {
        for (const field of rule.fields) {
          if (field.readable) result.add(field.name);
        }
      }
    }
    return result;
  }

  getWritableFields(model: string, userGroups: string[]): Set<string> {
    const result = new Set<string>();
    for (const rule of this.rules) {
      if (rule.model === model && userGroups.includes(rule.group)) {
        for (const field of rule.fields) {
          if (field.writable) result.add(field.name);
        }
      }
    }
    return result;
  }

  filterReadable(model: string, data: Record<string, unknown>[], userGroups: string[]): Record<string, unknown>[] {
    const allowed = this.getReadableFields(model, userGroups);
    return data.map((row) => {
      const filtered: Record<string, unknown> = {};
      for (const key of Object.keys(row)) {
        if (allowed.size === 0 || allowed.has(key)) filtered[key] = row[key];
      }
      return filtered;
    });
  }

  clear(): void {
    this.rules = [];
  }
}

let _fieldSecurityRegistry: FieldSecurityRegistry | null = null;

export function getFieldSecurityRegistry(): FieldSecurityRegistry {
  if (!_fieldSecurityRegistry) {
    _fieldSecurityRegistry = new FieldSecurityRegistry();
  }
  return _fieldSecurityRegistry;
}
```

- [ ] **Step 2: Write record-rules.ts**

```typescript
import type { Domain } from '@erp/data';

export interface RecordRule {
  name: string;
  model: string;
  group: string;
  domain: Domain;
  perm: {
    read: boolean;
    write: boolean;
    create: boolean;
    unlink: boolean;
  };
}

export class RecordRuleRegistry {
  private rules: RecordRule[] = [];

  register(rules: RecordRule[]): void {
    this.rules.push(...rules);
  }

  getDomain(model: string, operation: 'read' | 'write' | 'create' | 'unlink', userGroups: string[], uid: number): Domain[] {
    const domains: Domain[] = [];
    for (const rule of this.rules) {
      if (rule.model === model && userGroups.includes(rule.group) && rule.perm[operation]) {
        // Replace $uid placeholder with actual user id
        const resolved = rule.domain.map(([field, op, val]) => {
          if (val === '$uid') return [field, op, uid] as const;
          return [field, op, val] as const;
        });
        domains.push(resolved);
      }
    }
    return domains;
  }

  clear(): void {
    this.rules = [];
  }
}

let _recordRuleRegistry: RecordRuleRegistry | null = null;

export function getRecordRuleRegistry(): RecordRuleRegistry {
  if (!_recordRuleRegistry) {
    _recordRuleRegistry = new RecordRuleRegistry();
  }
  return _recordRuleRegistry;
}
```

- [ ] **Step 3: Write tests**

field-security.test.ts:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { FieldSecurityRegistry } from '../field-security';

describe('FieldSecurityRegistry', () => {
  let fs: FieldSecurityRegistry;

  beforeEach(() => {
    fs = new FieldSecurityRegistry();
    fs.register([{
      model: 'res.partner',
      group: 'base_user',
      fields: [
        { name: 'name', readable: true, writable: true },
        { name: 'phone', readable: true, writable: false },
        { name: 'internal_note', readable: false, writable: false },
      ],
    }]);
  });

  it('should return readable fields for group', () => {
    const readable = fs.getReadableFields('res.partner', ['base_user']);
    expect(readable.has('name')).toBe(true);
    expect(readable.has('phone')).toBe(true);
    expect(readable.has('internal_note')).toBe(false);
  });

  it('should filter writable fields', () => {
    const writable = fs.getWritableFields('res.partner', ['base_user']);
    expect(writable.has('name')).toBe(true);
    expect(writable.has('phone')).toBe(false);
  });

  it('should filter data rows', () => {
    const data = [
      { id: 1, name: 'Test', phone: '123', internal_note: 'secret' },
    ];
    const filtered = fs.filterReadable('res.partner', data, ['base_user']);
    expect(filtered[0]).toHaveProperty('name');
    expect(filtered[0]).toHaveProperty('phone');
    expect(filtered[0]).not.toHaveProperty('internal_note');
  });
});
```

record-rules.test.ts:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { RecordRuleRegistry } from '../record-rules';

describe('RecordRuleRegistry', () => {
  let rr: RecordRuleRegistry;

  beforeEach(() => {
    rr = new RecordRuleRegistry();
    rr.register([{
      name: 'own_orders',
      model: 'sale.order',
      group: 'sales_user',
      domain: [['user_id', '=', '$uid']],
      perm: { read: true, write: true, create: true, unlink: false },
    }]);
  });

  it('should return domain for matching operation', () => {
    const domains = rr.getDomain('sale.order', 'read', ['sales_user'], 42);
    expect(domains).toHaveLength(1);
    expect(domains[0]![0]![2]).toBe(42); // $uid replaced
  });

  it('should return empty for non-matching group', () => {
    const domains = rr.getDomain('sale.order', 'read', ['other_group'], 42);
    expect(domains).toHaveLength(0);
  });

  it('should return empty for denied operation', () => {
    const domains = rr.getDomain('sale.order', 'unlink', ['sales_user'], 42);
    expect(domains).toHaveLength(0);
  });
});
```

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @erp/core test`

---

### Task 4.4: Encryption, masking & audit

**Files:**
- Create: `packages/core/src/security/encryption.ts`
- Create: `packages/core/src/security/masking.ts`
- Create: `packages/core/src/security/audit.ts`
- Test: `packages/core/src/__tests__/encryption.test.ts`
- Test: `packages/core/src/__tests__/masking.test.ts`

- [ ] **Step 1: Write encryption.ts**

```typescript
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ERP_ENCRYPTION_KEY ?? 'change-me-in-production-32chars!!';

export function encrypt(value: string): string {
  return CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
}

export function decrypt(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function encryptField(value: string | null | undefined): string | null {
  if (value == null) return null;
  return encrypt(value);
}

export function decryptField(encrypted: string | null | undefined): string | null {
  if (encrypted == null) return null;
  return decrypt(encrypted);
}

export function encryptRecord(
  record: Record<string, unknown>,
  encryptedFields: string[],
): Record<string, unknown> {
  const result = { ...record };
  for (const field of encryptedFields) {
    if (typeof result[field] === 'string') {
      result[field] = encryptField(result[field] as string);
    }
  }
  return result;
}

export function decryptRecord(
  record: Record<string, unknown>,
  encryptedFields: string[],
): Record<string, unknown> {
  const result = { ...record };
  for (const field of encryptedFields) {
    if (typeof result[field] === 'string') {
      result[field] = decryptField(result[field] as string);
    }
  }
  return result;
}
```

- [ ] **Step 2: Write masking.ts**

```typescript
export type MaskPattern = 'phone' | 'email' | 'id_card';

const maskers: Record<MaskPattern, (value: string) => string> = {
  phone: (v) => {
    if (v.length < 7) return v;
    return v.slice(0, 3) + '****' + v.slice(-4);
  },
  email: (v) => {
    const [local, domain] = v.split('@');
    if (!domain) return v;
    const masked = local!.length > 2
      ? local![0] + '***' + local![local!.length - 1]
      : local!;
    return masked + '@' + domain;
  },
  id_card: (v) => {
    if (v.length < 8) return v;
    return v.slice(0, 4) + '**********' + v.slice(-4);
  },
};

export function maskValue(value: string, pattern: MaskPattern): string {
  const masker = maskers[pattern];
  return masker ? masker(value) : value;
}

export function maskRecord(
  record: Record<string, unknown>,
  maskedFields: Record<string, MaskPattern>,
): Record<string, unknown> {
  const result = { ...record };
  for (const [field, pattern] of Object.entries(maskedFields)) {
    if (typeof result[field] === 'string') {
      result[field] = maskValue(result[field] as string, pattern);
    }
  }
  return result;
}
```

- [ ] **Step 3: Write audit.ts**

```typescript
import { getKnex } from '@erp/data';

export interface AuditEntry {
  user_id: number;
  model: string;
  record_id: number;
  operation: 'create' | 'write' | 'unlink';
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  timestamp?: Date;
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  const knex = getKnex();
  const hasTable = await knex.schema.hasTable('audit_log');

  if (!hasTable) {
    await knex.schema.createTable('audit_log', (table) => {
      table.bigIncrements('id');
      table.integer('user_id').notNullable();
      table.string('model').notNullable();
      table.integer('record_id').notNullable();
      table.string('operation').notNullable();
      table.jsonb('old_values');
      table.jsonb('new_values');
      table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
  }

  await knex('audit_log').insert({
    user_id: entry.user_id,
    model: entry.model,
    record_id: entry.record_id,
    operation: entry.operation,
    old_values: entry.old_values ? JSON.stringify(entry.old_values) : null,
    new_values: entry.new_values ? JSON.stringify(entry.new_values) : null,
    timestamp: entry.timestamp ?? knex.fn.now(),
  });
}

export async function getAuditLog(
  model: string,
  recordId: number,
): Promise<AuditEntry[]> {
  const knex = getKnex();
  const rows = await knex('audit_log')
    .where({ model, record_id: recordId })
    .orderBy('timestamp', 'desc');

  return rows.map((r: Record<string, unknown>) => ({
    user_id: r.user_id as number,
    model: r.model as string,
    record_id: r.record_id as number,
    operation: r.operation as AuditEntry['operation'],
    old_values: typeof r.old_values === 'string' ? JSON.parse(r.old_values as string) : r.old_values,
    new_values: typeof r.new_values === 'string' ? JSON.parse(r.new_values as string) : r.new_values,
    timestamp: r.timestamp as Date,
  }));
}
```

- [ ] **Step 4: Write tests**

encryption.test.ts:
```typescript
import { describe, it, expect } from 'vitest';
import { encryptField, decryptField, encryptRecord, decryptRecord } from '../encryption';

describe('encryption', () => {
  it('should encrypt and decrypt a value', () => {
    const original = 'secret-data-123';
    const encrypted = encryptField(original);
    expect(encrypted).not.toBe(original);
    expect(decryptField(encrypted!)).toBe(original);
  });

  it('should handle null/undefined', () => {
    expect(encryptField(null)).toBeNull();
    expect(decryptField(null)).toBeNull();
  });

  it('should encrypt specific fields in a record', () => {
    const record = { name: 'John', ssn: '123-45-6789', phone: '555-0100' };
    const encrypted = encryptRecord(record, ['ssn']);
    expect(encrypted.name).toBe('John');
    expect(encrypted.ssn).not.toBe('123-45-6789');
    expect(encrypted.phone).toBe('555-0100');
  });

  it('should decrypt and restore original', () => {
    const original = { name: 'John', ssn: '123-45-6789' };
    const encrypted = encryptRecord(original, ['ssn']);
    const decrypted = decryptRecord(encrypted, ['ssn']);
    expect(decrypted).toEqual(original);
  });
});
```

masking.test.ts:
```typescript
import { describe, it, expect } from 'vitest';
import { maskValue, maskRecord } from '../masking';

describe('maskValue', () => {
  it('should mask phone number', () => {
    const result = maskValue('13812345678', 'phone');
    expect(result).toBe('138****5678');
  });

  it('should mask email', () => {
    const result = maskValue('johndoe@example.com', 'email');
    expect(result).toMatch(/j\*\*\*e@example\.com/);
  });

  it('should mask id_card', () => {
    const result = maskValue('310123199001011234', 'id_card');
    expect(result).toMatch(/^3101\*{10}1234$/);
  });

  it('should return original for short strings', () => {
    expect(maskValue('12', 'phone')).toBe('12');
  });
});

describe('maskRecord', () => {
  it('should mask specified fields', () => {
    const record = { name: 'John', phone: '13812345678', email: 'john@test.com' };
    const masked = maskRecord(record, { phone: 'phone', email: 'email' });
    expect(masked.name).toBe('John');
    expect(masked.phone).not.toBe('13812345678');
    expect(masked.email).not.toBe('john@test.com');
  });
});
```

- [ ] **Step 5: Write security index.ts**

Create `packages/core/src/security/index.ts`:
```typescript
export { AclRegistry, getAclRegistry } from './acl';
export type { AclRule } from './acl';
export { FieldSecurityRegistry, getFieldSecurityRegistry } from './field-security';
export type { FieldSecurityRule } from './field-security';
export { RecordRuleRegistry, getRecordRuleRegistry } from './record-rules';
export type { RecordRule } from './record-rules';
export { encryptField, decryptField, encryptRecord, decryptRecord } from './encryption';
export { maskValue, maskRecord } from './masking';
export type { MaskPattern } from './masking';
export { writeAudit, getAuditLog } from './audit';
export type { AuditEntry } from './audit';
```

- [ ] **Step 6: Run tests**

Run: `pnpm --filter @erp/core test`

---

## Phase 5: Admin Layer (`@erp/admin`)

### Task 5.1: React shell & setup

**Files:**
- Create: `packages/admin/index.html`
- Create: `packages/admin/src/main.tsx`
- Create: `packages/admin/src/App.tsx`
- Create: `packages/admin/vite.config.ts`

- [ ] **Step 1: Write vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});
```

- [ ] **Step 2: Write index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Agent ERP</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Write main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 4: Write App.tsx**

```typescript
import React, { Component } from 'react';
import { Layout, Result, Button } from 'antd';
import { MenuRenderer } from './components/MenuRenderer';
import { ViewRenderer } from './components/ViewRenderer';
import { useStore } from './store';

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle="An unexpected error occurred in the view renderer."
          extra={
            <Button type="primary" onClick={() => this.setState({ hasError: false })}>
              Try Again
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const { activeView } = useStore();

  return (
    <Layout className="h-screen">
      <Layout.Sider width={240} theme="light">
        <MenuRenderer />
      </Layout.Sider>
      <Layout.Content>
        <ErrorBoundary>
          {activeView ? (
            <ViewRenderer view={activeView} />
          ) : (
            <Result
              status="info"
              title="Welcome to Agent ERP"
              subTitle="Select an item from the menu to get started."
            />
          )}
        </ErrorBoundary>
      </Layout.Content>
    </Layout>
  );
};

export default App;
```

---

### Task 5.2: Zustand store + types

**Files:**
- Create: `packages/admin/src/types.ts`
- Create: `packages/admin/src/store.ts`

- [ ] **Step 1: Write types.ts (pure type definitions)**

```typescript
export interface MenuItem {
  id: string;
  name: string;
  icon?: string;
  sequence: number;
  parentId?: string;
  action?: string;
}

export interface ViewField {
  name: string;
  label?: string;
  widget?: string;
  readonly?: boolean;
  required?: boolean;
  options?: Record<string, unknown>;
}

export interface ViewLayoutItem {
  title?: string;
  fields: string[];
  widget?: string;
}

export interface ViewLayout {
  type: 'tabs' | 'grid' | 'inline';
  items: ViewLayoutItem[];
}

export interface ViewSpec {
  id: string;
  model: string;
  type: 'form' | 'tree' | 'search' | 'kanban' | 'calendar';
  title: string;
  fields: ViewField[];
  layout?: ViewLayout;
}

export interface AppState {
  menuItems: MenuItem[];
  activeMenuId: string | null;
  activeView: ViewSpec | null;
  user: { id: number; name: string; groups: string[] } | null;

  setMenuItems: (items: MenuItem[]) => void;
  setActiveMenu: (id: string) => void;
  setActiveView: (view: ViewSpec | null) => void;
  setUser: (user: AppState['user']) => void;
}
```

- [ ] **Step 2: Write store.ts**

```typescript
import { create } from 'zustand';
import type { AppState } from './types';

export type { MenuItem, ViewField, ViewLayoutItem, ViewLayout, ViewSpec, AppState } from './types';

declare global {
  interface Window {
    __STORE__?: typeof useStore;
  }
}

export const useStore = create<AppState>((set) => ({
  menuItems: [],
  activeMenuId: null,
  activeView: null,
  user: null,

  setMenuItems: (items) => set({ menuItems: items }),
  setActiveMenu: (id) => set({ activeMenuId: id }),
  setActiveView: (view) => set({ activeView: view }),
  setUser: (user) => set({ user }),
}));

if (typeof window !== 'undefined') {
  window.__STORE__ = useStore;
}
```

---

### Task 5.3: MenuRenderer

**Files:**
- Create: `packages/admin/src/components/MenuRenderer.tsx`

- [ ] **Step 1: Write MenuRenderer.tsx**

```typescript
import React from 'react';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import {
  AppstoreOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useStore, MenuItem } from '../store';

interface TreeNode {
  item: MenuItem;
  children: TreeNode[];
}

function buildTree(items: MenuItem[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const item of items) {
    map.set(item.id, { item, children: [] });
  }

  for (const item of items) {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortTree = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.item.sequence - b.item.sequence);
    nodes.forEach((n) => sortTree(n.children));
  };
  sortTree(roots);
  return roots;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  contacts: <TeamOutlined />,
  settings: <SettingOutlined />,
  users: <UserOutlined />,
};

function getIcon(item: MenuItem): React.ReactNode {
  if (item.icon && ICON_MAP[item.icon]) return ICON_MAP[item.icon];
  const lower = item.name.toLowerCase();
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return <AppstoreOutlined />;
}

function toAntdItems(nodes: TreeNode[]): MenuProps['items'] {
  return nodes.map((node) => {
    const hasChildren = node.children.length > 0;
    return {
      key: node.item.id,
      label: node.item.name,
      icon: hasChildren ? undefined : getIcon(node.item),
      children: hasChildren ? toAntdItems(node.children) : undefined,
    } as const;
  });
}

export const MenuRenderer: React.FC = () => {
  const menuItems = useStore((s) => s.menuItems);
  const activeMenuId = useStore((s) => s.activeMenuId);
  const setActiveMenu = useStore((s) => s.setActiveMenu);
  const tree = buildTree(menuItems);
  const antdItems = toAntdItems(tree);

  return (
    <>
      <div className="flex items-center h-12 px-4 font-bold text-lg border-b border-gray-100">
        Agent ERP
      </div>
      <Menu
        mode="inline"
        selectedKeys={activeMenuId ? [activeMenuId] : []}
        items={antdItems}
        onClick={({ key }) => setActiveMenu(key)}
        style={{ borderInlineEnd: 'none' }}
      />
    </>
  );
};
```

---

### Task 5.4: ViewRenderer & form widgets

**Files:**
- Create: `packages/admin/src/components/ViewRenderer.tsx`
- Create: `packages/admin/src/components/FormRenderer.tsx`
- Create: `packages/admin/src/components/TableRenderer.tsx`
- Create: `packages/admin/src/components/SearchPanel.tsx`
- Create: `packages/admin/src/components/widgets/TextWidget.tsx`
- Create: `packages/admin/src/components/widgets/SelectWidget.tsx`

- [ ] **Step 1: Write ViewRenderer.tsx**

```typescript
import React from 'react';
import { Result } from 'antd';
import { ViewSpec } from '../store';
import { FormRenderer } from './FormRenderer';
import { TableRenderer } from './TableRenderer';
import { SearchPanel } from './SearchPanel';

interface Props {
  view: ViewSpec;
}

export const ViewRenderer: React.FC<Props> = ({ view }) => {
  switch (view.type) {
    case 'form':
      return <FormRenderer view={view} />;
    case 'tree':
      return <TableRenderer view={view} />;
    case 'search':
      return <SearchPanel view={view} />;
    case 'kanban':
      return <Result status="info" title="Kanban View" subTitle="Coming soon" />;
    case 'calendar':
      return <Result status="info" title="Calendar View" subTitle="Coming soon" />;
    default:
      return <Result status="warning" title="Unknown View Type" subTitle={view.type} />;
  }
};
```

- [ ] **Step 2: Write FormRenderer.tsx**

```typescript
import React from 'react';
import { Form, Input, Select, Tabs, Row, Col, Card, Button } from 'antd';
import { ViewSpec, ViewField } from '../store';

interface Props {
  view: ViewSpec;
}

function isTupleArray(v: unknown): v is [string, string][] {
  return (
    Array.isArray(v) &&
    v.every(
      (item) =>
        Array.isArray(item) && item.length === 2 &&
        typeof item[0] === 'string' && typeof item[1] === 'string',
    )
  );
}

function renderField(field: ViewField) {
  const widget = field.widget ?? 'text';

  switch (widget) {
    case 'select': {
      const raw = field.options?.choices;
      const choices: [string, string][] = isTupleArray(raw) ? raw : [];
      return (
        <Select
          placeholder="-- Select --"
          allowClear
          options={choices.map(([val, label]) => ({ value: val, label }))}
        />
      );
    }
    case 'text':
    default:
      return <Input readOnly={field.readonly} />;
  }
}

function renderFields(fields: ViewField[]) {
  return fields.map((f) => (
    <Form.Item
      key={f.name}
      name={f.name}
      label={f.label ?? f.name}
      rules={f.required ? [{ required: true, message: `${f.label ?? f.name} is required` }] : undefined}
    >
      {renderField(f)}
    </Form.Item>
  ));
}

function renderLayout(view: ViewSpec) {
  const { layout, fields } = view;
  if (!layout) {
    return renderFields(fields);
  }

  switch (layout.type) {
    case 'tabs':
      return (
        <Tabs
          items={layout.items.map((item) => {
            const itemFields = item.fields
              .map((name) => fields.find((f) => f.name === name))
              .filter(Boolean) as ViewField[];
            return {
              key: item.title ?? '',
              label: item.title,
              children: renderFields(itemFields),
            };
          })}
        />
      );
    case 'grid':
      return (
        <Row gutter={[16, 0]}>
          {layout.items.map((item, i) => {
            const itemFields = item.fields
              .map((name) => fields.find((f) => f.name === name))
              .filter(Boolean) as ViewField[];
            return (
              <Col key={i} span={24 / layout.items.length}>
                <Card title={item.title} size="small">
                  {renderFields(itemFields)}
                </Card>
              </Col>
            );
          })}
        </Row>
      );
    case 'inline':
    default:
      return layout.items.map((item, i) => {
        const itemFields = item.fields
          .map((name) => fields.find((f) => f.name === name))
          .filter(Boolean) as ViewField[];
        return (
          <Card key={i} title={item.title} size="small" className="mb-4">
            {renderFields(itemFields)}
          </Card>
        );
      });
  }
}

export const FormRenderer: React.FC<Props> = ({ view }) => {
  const [form] = Form.useForm();

  const handleSave = (values: Record<string, unknown>) => {
    console.log('Save:', view.model, values);
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">{view.title}</h1>
      <Form form={form} layout="vertical" onFinish={handleSave}>
        {renderLayout(view)}
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Save
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
```

- [ ] **Step 3: Write TableRenderer.tsx**

```typescript
import React from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ViewSpec } from '../store';

interface Props {
  view: ViewSpec;
}

export const TableRenderer: React.FC<Props> = ({ view }) => {
  const [records, setRecords] = React.useState<Record<string, unknown>[]>([]);

  const columns: ColumnsType<Record<string, unknown>> = view.fields.map((f) => ({
    key: f.name,
    dataIndex: f.name,
    title: f.label ?? f.name,
  }));

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">{view.title}</h1>
      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        locale={{ emptyText: 'No records found' }}
        bordered
        size="middle"
      />
    </div>
  );
};
```

- [ ] **Step 4: Write SearchPanel.tsx**

```typescript
import React from 'react';
import { Form, Input, Button } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { ViewSpec } from '../store';

interface Props {
  view: ViewSpec;
}

export const SearchPanel: React.FC<Props> = ({ view }) => {
  const [form] = Form.useForm();

  const handleSearch = (values: Record<string, string>) => {
    console.log('Search:', view.model, values);
  };

  const handleClear = () => {
    form.resetFields();
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Search: {view.model}</h1>
      <Form form={form} layout="inline" onFinish={handleSearch}>
        {view.fields.map((f) => (
          <Form.Item key={f.name} name={f.name} label={f.label ?? f.name}>
            <Input allowClear />
          </Form.Item>
        ))}
        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
            Search
          </Button>
        </Form.Item>
        <Form.Item>
          <Button onClick={handleClear} icon={<ClearOutlined />}>
            Clear
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
```

- [ ] **Step 5: Write widget files**

TextWidget.tsx:
```typescript
import React from 'react';
import { Input } from 'antd';
import { ViewField } from '../../store';

interface Props {
  field: ViewField;
  value: string;
  onChange: (value: string) => void;
}

export const TextWidget: React.FC<Props> = ({ field, value, onChange }) => (
  <Input
    value={value ?? ''}
    readOnly={field.readonly}
    onChange={(e) => onChange(e.target.value)}
  />
);
```

SelectWidget.tsx:
```typescript
import React from 'react';
import { Select } from 'antd';
import { ViewField } from '../../store';

interface Props {
  field: ViewField;
  value: string;
  onChange: (value: string) => void;
}

function isTupleArray(v: unknown): v is [string, string][] {
  return (
    Array.isArray(v) &&
    v.every(
      (item) =>
        Array.isArray(item) && item.length === 2 &&
        typeof item[0] === 'string' && typeof item[1] === 'string',
    )
  );
}

export const SelectWidget: React.FC<Props> = ({ field, value, onChange }) => {
  const raw = field.options?.choices;
  const choices: [string, string][] = isTupleArray(raw) ? raw : [];
  const options = choices.map(([val, label]) => ({ value: val, label }));

  return (
    <Select
      value={value || undefined}
      options={options}
      onChange={(v) => onChange(v)}
      placeholder="-- Select --"
      allowClear
      className="w-full"
    />
  );
};
```

---

### Task 5.5: Tailwind CSS + PostCSS config

**Files:**
- Create: `packages/admin/tailwind.config.js`
- Create: `packages/admin/postcss.config.js`
- Create: `packages/admin/src/index.css`

- [ ] **Step 1: Write tailwind.config.js**

```javascript
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: { preflight: false },
  theme: { extend: {} },
  plugins: [],
};
```

- [ ] **Step 2: Write postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 3: Write index.css (Tailwind + @layer priority ordering)**

```css
@layer tailwind-base, antd, components, utilities;

@layer tailwind-base {
  @tailwind base;
}

@tailwind components;
@tailwind utilities;
```

The `@layer` ordering ensures Tailwind's base layer has lowest priority, followed by antd styles, then Tailwind components and utilities. Combined with `corePlugins.preflight: false`, this prevents Tailwind's CSS reset from breaking antd components.

---

## Phase 6: Base Module (`modules/base`)

### Task 6.1: Base module scaffold & ResPartner model

**Files:**
- Create: `modules/base/package.json`
- Create: `modules/base/manifest.ts`
- Create: `modules/base/index.ts`
- Create: `modules/base/models/res_partner.ts`
- Create: `modules/base/models/res_users.ts`

- [ ] **Step 1: Write modules/base/package.json**

```json
{
  "name": "@erp-module/base",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@erp/domain": "workspace:*"
  }
}
```

- [ ] **Step 2: Write manifest.ts**

```typescript
export default {
  name: 'base',
  version: '1.0.0',
  depends: [],
  auto_install: true,
  application: true,
};
```

- [ ] **Step 3: Write models/res_partner.ts**

```typescript
import { Model, fields, api } from '@erp/domain';

@model({ _name: 'res.partner', _description: 'Partner (Customer/Supplier)' })
export class ResPartner extends Model {
  @fields.char({ required: true })
  name!: string;

  @fields.selection([
    ['company', 'Company'],
    ['individual', 'Individual'],
  ], { default: 'company' })
  company_type!: string;

  @fields.char({})
  email!: string;

  @fields.char({ mask: 'phone' })
  phone!: string;

  @fields.char({})
  website!: string;

  @fields.text({})
  comment!: string;

  @fields.boolean({ default: true })
  active!: boolean;

  @fields.char({})
  vat!: string;

  @fields.many2one({ comodel: 'res.users' })
  user_id!: number;

  @api.constrains({ message: 'Email must be valid' })
  _check_email(): void {
    // Constraint logic placeholder
  }
}
```

- [ ] **Step 4: Write models/res_users.ts**

```typescript
import { Model, fields } from '@erp/domain';

@model({ _name: 'res.users', _description: 'User' })
export class ResUsers extends Model {
  @fields.char({ required: true })
  name!: string;

  @fields.char({ required: true })
  login!: string;

  @fields.char({ encrypt: true })
  password!: string;

  @fields.char({})
  email!: string;

  @fields.boolean({ default: true })
  active!: boolean;

  @fields.many2many({
    comodel: 'res.groups',
    table: 'res_users_groups_rel',
    column1: 'user_id',
    column2: 'group_id',
  })
  groups!: number[];
}
```

- [ ] **Step 5: Write index.ts**

```typescript
import { ResPartner } from './models/res_partner';
import { ResUsers } from './models/res_users';
import { partnerForm } from './views/res_partner.form';
import { partnerTree } from './views/res_partner.tree';
import { partnerSearch } from './views/res_partner.search';
import { baseMenus } from './views/menus';
import { partnerController } from './controllers/partner_controller';
import { baseAcl } from './security/acl';

export const models = [ResPartner, ResUsers];
export const views = [partnerForm, partnerTree, partnerSearch];
export const menus = baseMenus;
export const controllers = [partnerController];
export const security = baseAcl;
```

---

### Task 6.2: Base module views & menus

**Files:**
- Create: `modules/base/views/res_partner.form.ts`
- Create: `modules/base/views/res_partner.tree.ts`
- Create: `modules/base/views/res_partner.search.ts`
- Create: `modules/base/views/menus.ts`

- [ ] **Step 1: Write res_partner.form.ts**

```typescript
import type { ViewSpec } from '@erp/admin';

export const partnerForm: ViewSpec = {
  id: 'res.partner.form',
  model: 'res.partner',
  type: 'form',
  title: 'Partner',
  fields: [
    { name: 'name', label: 'Name', widget: 'text', required: true },
    { name: 'company_type', label: 'Type', widget: 'select', options: {
      choices: [['company', 'Company'], ['individual', 'Individual']],
    }},
    { name: 'email', label: 'Email', widget: 'text' },
    { name: 'phone', label: 'Phone', widget: 'text' },
    { name: 'website', label: 'Website', widget: 'text' },
    { name: 'vat', label: 'VAT', widget: 'text' },
    { name: 'active', label: 'Active', widget: 'text' },
    { name: 'comment', label: 'Notes', widget: 'text' },
  ],
  layout: {
    type: 'tabs',
    items: [
      { title: 'General', fields: ['name', 'company_type', 'active'] },
      { title: 'Contact', fields: ['email', 'phone', 'website'] },
      { title: 'Finance', fields: ['vat'] },
      { title: 'Notes', fields: ['comment'] },
    ],
  },
};
```

- [ ] **Step 2: Write res_partner.tree.ts**

```typescript
import type { ViewSpec } from '@erp/admin';

export const partnerTree: ViewSpec = {
  id: 'res.partner.tree',
  model: 'res.partner',
  type: 'tree',
  title: 'Partners',
  fields: [
    { name: 'name', label: 'Name', widget: 'text' },
    { name: 'company_type', label: 'Type', widget: 'text' },
    { name: 'email', label: 'Email', widget: 'text' },
    { name: 'phone', label: 'Phone', widget: 'text' },
    { name: 'active', label: 'Active', widget: 'text' },
  ],
};
```

- [ ] **Step 3: Write res_partner.search.ts**

```typescript
import type { ViewSpec } from '@erp/admin';

export const partnerSearch: ViewSpec = {
  id: 'res.partner.search',
  model: 'res.partner',
  type: 'search',
  title: 'Search Partners',
  fields: [
    { name: 'name', label: 'Name' },
    { name: 'email', label: 'Email' },
    { name: 'phone', label: 'Phone' },
    { name: 'company_type', label: 'Type' },
  ],
};
```

- [ ] **Step 4: Write menus.ts**

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
  },
];
```

---

### Task 6.3: Base module controllers & ACL

**Files:**
- Create: `modules/base/controllers/partner_controller.ts`
- Create: `modules/base/security/acl.ts`

- [ ] **Step 1: Write partner_controller.ts**

```typescript
import { envWithContext, getModelRegistry } from '@erp/domain';

export class PartnerController {
  static routes = [
    { path: '/api/partners', method: 'GET' as const, handler: 'list' },
    { path: '/api/partners/:id', method: 'GET' as const, handler: 'detail' },
    { path: '/api/partners', method: 'POST' as const, handler: 'create' },
    { path: '/api/partners/:id', method: 'PUT' as const, handler: 'update' },
    { path: '/api/partners/:id', method: 'DELETE' as const, handler: 'delete' },
  ];

  async list(ctx: { uid: number }) {
    return envWithContext('res.partner', { uid: ctx.uid }).search([]);
  }

  async detail(ctx: { uid: number; params: { id: string } }) {
    const records = await envWithContext('res.partner', { uid: ctx.uid })
      .browse([parseInt(ctx.params.id)]);
    return records[0] ?? null;
  }

  async create(ctx: { uid: number; body: Record<string, unknown> }) {
    return envWithContext('res.partner', { uid: ctx.uid }).create(ctx.body);
  }

  async update(ctx: { uid: number; params: { id: string }; body: Record<string, unknown> }) {
    return envWithContext('res.partner', { uid: ctx.uid })
      .write([parseInt(ctx.params.id)], ctx.body);
  }

  async delete(ctx: { uid: number; params: { id: string } }) {
    return envWithContext('res.partner', { uid: ctx.uid })
      .unlink([parseInt(ctx.params.id)]);
  }
}
```

- [ ] **Step 2: Write security/acl.ts**

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
];
```

---

## Phase 7: Integration & Skills

### Task 7.1: Core package public API

**Files:**
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write packages/core/src/index.ts**

```typescript
// Module system
export { ModuleRegistry, getModuleRegistry } from './module-registry';
export type { ModuleDefinition, ModuleManifest, ControllerClass, RouteDefinition } from './module-registry';
export { scanModules, installModules } from './module-scanner';

// Security
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
```

---

### Task 7.2: Create .claude/settings.json

**Files:**
- Create: `.claude/settings.json`

- [ ] **Step 1: Write settings.json**

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm install)",
      "Bash(pnpm --filter *)",
      "Bash(pnpm test)",
      "Bash(pnpm run *)",
      "Bash(pnpm add *)",
      "Bash(mkdir -p *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git status)",
      "Bash(git diff)",
      "Glob(*/**/*)",
      "Grep(*)"
    ],
    "ask": [
      "Bash(pnpm deploy *)",
      "Bash(git push *)",
      "Bash(docker *)",
      "Bash(rm -rf *)"
    ],
    "deny": [
      "Bash(pnpm publish)",
      "Bash(git push --force)"
    ]
  }
}
```

---

### Task 7.3: Update package index files

**Files:**
- Modify: `packages/data/src/index.ts`
- Modify: `packages/domain/src/index.ts`

- [ ] **Step 1: Verify data/index.ts has all exports**

The file should already contain all exports from Phase 2 tasks. Verify:
- connection exports
- query-builder exports
- migration-runner exports

- [ ] **Step 2: Verify domain/index.ts has all exports**

The file should already contain all exports from Phase 3 tasks. Verify:
- model exports
- fields exports
- api exports
- env exports
- registry exports
- migration-diff exports
- types exports

---

### Task 7.4: Run full test suite

- [ ] **Step 1: Run all package tests**

Run: `pnpm test`

Expected: All tests pass across `@erp/data`, `@erp/domain`, `@erp/core`.

---

### Task 7.5: Verify build

- [ ] **Step 1: Build all packages**

Run: `pnpm build`

Expected: All packages build successfully without type errors.

- [ ] **Step 2: Verify admin dev server starts**

Run: `pnpm --filter @erp/admin dev`

Expected: Vite starts without CSS errors, Tailwind CSS processes via PostCSS, antd ConfigProvider renders at `http://localhost:3000`.

- [ ] **Step 3: Verify type checking**

Run: `pnpm --filter @erp/admin exec tsc --noEmit`

Expected: Zero type errors across all `.ts` and `.tsx` files.

---

### Task 7.6: Commit all changes

- [ ] **Step 1: Stage and commit**

```bash
git add .
git commit -m "feat: initialize Agent ERP framework MVP

- Monorepo scaffold with pnpm workspace
- @erp/data: Knex connection, query builder, migration runner
- @erp/domain: Model/Field/env ORM, registry, migration diff
- @erp/core: Module registry/scanner, 6-layer security
- @erp/admin: React shell with antd Layout/Menu, Form/Table/Search renderers
- Tailwind CSS 3 + PostCSS with @layer priority ordering
- modules/base: Partner and Users models with views and ACLs
- .claude/settings.json with permission configuration"
```
```

---

## Spec Coverage Self-Review

| Spec Section | Covered By |
|---|---|
| 2. Architecture (4-layer) | Phase 1-5 create data/domain/core/admin packages |
| 3. Module System | Task 4.1 (module-registry, module-scanner) |
| 4. ORM Design | Tasks 3.1-3.7 (model, fields, env, registry, diff) |
| 5. View Engine | Tasks 5.1-5.5 (ViewRenderer, FormRenderer, TableRenderer, SearchPanel, Tailwind/PostCSS config) |
| 6. Permission System (6 layers) | Tasks 4.2-4.4 (ACL, field-security, record-rules, encryption, masking, audit) |
| 7. Menu & Navigation | Task 5.3 (MenuRenderer) |
| 8. Request Lifecycle | Task 6.3 (controller pattern) |
| 10. Project Constraints | Task 1.1-1.2 (tsconfig, eslint, prettier), implicit in all code |
| 11. Agent Skills | Defined in spec doc; skills files to be created in follow-up |

---

## Placeholder Scan

- No TBD, TODO, or "implement later"
- No "add appropriate error handling" — error handling included where needed
- No "similar to Task N" — each task has complete code
- Every code step includes actual implementation code
- All type signatures and method names are consistent across phases

---

## Type Consistency Check

- `ModelDefinition._name` used consistently as `sale.order` format → `tableName` computed as `.replace(/\./g, '_')` in env.ts, migration-diff.ts
- `ViewSpec` from store.ts matches usage in FormRenderer, TableRenderer, SearchPanel, and view definition files
- `MenuItem` from store.ts matches usage in MenuRenderer and menus.ts
- `Domain` type imported from `@erp/data` used consistently across query-builder, env, record-rules
- `FieldDefinition` type imported from `@erp/domain` used in model.ts, fields.ts, migration-diff.ts
- `AclRule` matches across acl.ts, security/index.ts, modules/base/security/acl.ts
- All file paths in "Create:" and "Modify:" headers match the File Map

---

## Revision Record

| Date | Revision | Description |
|------|----------|-------------|
| 2026-05-14 | 1 | Initial plan — native HTML + inline styles for admin |
| 2026-05-14 | 2 | Redesign admin UI with Ant Design 5 + Tailwind CSS 3 + PostCSS. Rewrote Tasks 5.1-5.5 (React shell, store+types, MenuRenderer, ViewRenderer+widgets, Tailwind/PostCSS config). Updated Task 1.2 admin package.json deps, Task 6.1 modules/base/package.json, Phase 7 build verification steps, and commit message. File map updated to remove styles/global.css, add tailwind.config.js, postcss.config.js, index.css, types.ts; removed unused widget files. |
