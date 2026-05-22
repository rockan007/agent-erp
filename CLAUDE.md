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

# Start admin dev server (default port 3000, may use next available)
pnpm --filter @erp/admin dev

# Run e2e tests (Playwright, requires dev server)
npx playwright test --config=packages/admin/playwright.config.ts

# Clean up test-generated files after each test run
# (screenshots, snapshots, etc. under .playwright-mcp/ and project root *.png)
rm -rf .playwright-mcp/*.png *.png

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
│   └── admin/          # @erp/admin — React + Vite + antd 5 + Tailwind CSS 3 shell
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

**Tech:** React 18, Ant Design 5, Tailwind CSS 3 (via PostCSS), framer-motion, Zustand, Playwright (e2e).

**Design tokens:** `--font-display: 'Syne', sans-serif`, `--font-body: 'DM Sans', sans-serif`. Primary: `#1890ff`, brand gradient: `linear-gradient(135deg, #1890ff, #40a9ff)`.

**Layout:** `App.tsx` renders `<Layout>` with `AppHeader` (top bar, 48px), light `<Sider>` (`#fafafa`, desktop) or `<Drawer>` (mobile `< 768px`), `<Content>` with `<PageHeader>` + `<ErrorBoundary>` wrapping `<ViewRenderer>`.

- **`types.ts`**: Pure type definitions — `MenuItem`, `ViewSpec`, `ViewField`, `ViewLayout`, `AppState`, `BreadcrumbItem`.
- **`store.ts`**: Zustand store — `menuItems`, `activeMenuId`, `activeView`, `user`, `token`, `siderCollapsed`, `breadcrumbs`. `computeBreadcrumbs()` walks menu tree upward from `activeMenuId` via `parentId`. `login(name, password)` calls `/api/auth/login`, stores JWT in localStorage, sets `user` + `token`. `logout()` clears state + localStorage. `initializeAuth()` restores session from localStorage on mount (reads `erp_token` + `erp_user`). Store exposed on `window.__STORE__` for e2e state injection.
- **`LoginPage.tsx`**: Full-screen login with light blue-white background (`#f0f4ff`), 3 radial gradient blobs (blue + purple), top-left brand (gradient "A" icon + "Agent ERP" + "智能企业管理平台"), centered white card (18px radius, dual-layer shadow) with username/password inputs (10px radius, `#f7f8fa` bg) and gradient blue button. Card, inputs, button, and blobs all use `clamp()` for responsive scaling across viewports. framer-motion: card entrance (fade + slide 24px), error shake, exit fade. Mobile (`< 640px`): brand centers at top, card fills width with side margins.
- **`DashboardPage.tsx`**: Welcome dashboard — stat cards row, chart placeholder, activity list, action pills. Replaces the old welcome screen.
- **`AppHeader.tsx`**: Header bar (48px, `#fff`, bottom shadow) — collapse toggle button, brand logo ("A" in gradient box) + "Agent ERP" text, notification bell icon (`BellOutlined`), user pill dropdown (avatar + name, "My Profile" / "Logout").
- **`PageHeader.tsx`**: View title (`<Title level={4}>`) + action buttons area, `px-6 py-3`, bottom border.
- **`MenuRenderer.tsx`**: `buildTree()` converts flat `MenuItem[]` to tree sorted by `sequence`. `toAntdItems()` maps to antd `Menu` `items` prop with icon lookup. Menu uses `theme="light"` with `#fafafa` background. Section labels rendered as `Menu.ItemGroup` titles. Supports `onItemClick` callback for mobile drawer close.
- **`ViewRenderer.tsx`**: Dispatches on `view.type` → `FormRenderer` / `TableRenderer` / `SearchPanel` / kanban placeholder / calendar placeholder. Wraps content in `<AnimatePresence mode="wait">` + `<motion.div>` (150ms fade + y slide).
- **`FormRenderer.tsx`**: antd `<Form>` with `layout="vertical"` wrapped in a white card with shadow. Widget dispatch: `text` → `<Input>`, `select` → `<Select>`. Supports `tabs`/`grid`/`inline` layouts. Content constrained to `max-w-3xl mx-auto`.
- **`TableRenderer.tsx`**: antd `<Table>` with `columns` from `view.fields`, `bordered`, `size="middle"`, empty state "No records found". Responsive `scroll.x` on mobile.
- **`SearchPanel.tsx`**: antd `<Form>` with `layout="inline"` (vertical on mobile `< md`). `<Input>` per field, Search/Clear buttons. Content constrained to `max-w-4xl mx-auto`.
- **`ErrorBoundary.tsx`**: Class component with `getDerivedStateFromError` + `componentDidCatch` (logs errors). Shows `<Result status="error">` with Retry button. Resets on navigation via `componentDidUpdate`.
- **`main.tsx`**: Entry point — calls `useStore.getState().initializeAuth()` before rendering `<App>`. If valid `erp_token` + `erp_user` in localStorage, user skips login.
- **`index.css`**: Tailwind directives with `@layer` ordering (`tailwind-base → antd → components → utilities`), `corePlugins.preflight: false` to avoid antd CSS conflicts.
- **`tailwind.config.js`**: Content paths for `./src/**/*.{ts,tsx}`, `corePlugins.preflight: false`.
- **`postcss.config.js`**: tailwindcss + autoprefixer plugins.
- **`playwright.config.ts`**: Chrome channel, `baseURL: http://localhost:3000`, `testDir: ./e2e`.
- **`vitest.config.ts`**: Excludes `e2e/**` from vitest runs.

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

## Workflow

- **Prefer Subagent-Driven mode** for executing implementation plans. When a plan has multiple tasks, use `superpowers:subagent-driven-development` — it dispatches fresh subagents per task with automated spec + code quality review between tasks. Faster iteration, less context pollution.
- **Code review must include ESLint check.** Run `pnpm lint` (or the package-specific lint command) as part of every code review. Lint errors are blocking — fix them before merging.

## Key Conventions

- Table names: `model._table` if set, otherwise `model._name.replace(/\./g, '_')` (e.g. `res.partner` → `res_partner`)
- `reflect-metadata` must be imported before decorators execute (imported in `model.ts`)
- Knex client is `pg` (PostgreSQL). Connection is a module-level singleton.
- `tsconfig.base.json` enforces `strict: true`, `noUncheckedIndexedAccess: true`, `experimentalDecorators: true`
- Admin package has its own `jsx: "react-jsx"` setting; other packages compile via tsup

## Internationalization (i18n)

**Library:** i18next (react-i18next for React, i18next-browser-languagedetector for detection, i18next on Node.js backend).

**Languages:** Extensible architecture, first batch `zh_CN` + `en_US`. Language code convention: underscore separator (`zh_CN`), auto-mapped from browser hyphen format (`zh-CN`) via `convertDetectedLanguage`.

**Detection:** `localStorage` (key: `erp_lang`) first, then `navigator.language`. Language persists in localStorage on manual switch.

### Frontend (`packages/admin/src/i18n.ts`)

- **Namespaces:** `common` (header, sidebar, breadcrumbs), `auth` (login/register/forgot pages), `dashboard` (welcome screen)
- **Locale files:** `packages/admin/src/locales/{zh_CN,en_US}/{common,auth,dashboard}.json`
- **Usage:** `useTranslation('auth')` hook, or `useTranslation()` for common namespace. Import `i18n` directly for `i18n.changeLanguage(key)` in language switcher.
- **Ant Design:** `ConfigProvider locale` synced via `i18n.on('languageChanged')` listener in `Root` component (`main.tsx`). `getAntdLocale()` maps i18n language to antd locale import.
- **Adding a language:** Create matching JSON files under `locales/<new_locale>/`, add to `resources` in `i18n.ts`, add to `langItems` in `AppHeader.tsx`.

### Backend (`packages/core/src/i18n/index.ts`)

- **Purpose:** Translates API error messages per-request based on `Accept-Language` header
- **`getRequestLocale(langHeader?)`**: Parses `Accept-Language` with quality values, maps to `zh_CN`/`en_US`
- **`tError(lang, key, params?)`**: Returns translated error string via `i18n.getFixedT(lang)`
- **Controller pattern:** `const lang = ctx.locale ?? 'en_US';` then `tError(lang, 'errors:auth.invalid_credentials')`
- **Middleware:** Vite SSR module loads `getRequestLocale` from `@erp/core`, sets `ctx.locale`
- **Adding backend translations:** Add keys under `errors:` in `packages/core/src/i18n/index.ts` errorResources
