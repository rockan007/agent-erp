# ESLint Airbnb Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install Airbnb ESLint rules with per-package config (airbnb-base for backend, airbnb for admin), fix all 42 existing lint errors, and enforce linting via pre-commit hook.

**Architecture:** Root `.eslintrc.json` for backend packages (data, domain, core, modules) using airbnb-base + airbnb-typescript/base + prettier. Admin gets its own `.eslintrc.json` adding airbnb + React rules. Shared rule overrides (no-console, no-param-reassign, etc.) live in root config. pre-commit via husky + lint-staged.

**Tech Stack:** ESLint 8, @typescript-eslint 7, eslint-config-airbnb/base, eslint-config-airbnb-typescript, eslint-config-prettier, husky + lint-staged, TypeScript 5.4, pnpm 8+

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json` (root devDependencies)
- Modify: `packages/admin/package.json` (devDependencies)

- [ ] **Step 1: Install root devDependencies**

```bash
cd D:/projects/agent-erp && pnpm add -D -w eslint-config-airbnb-base eslint-config-airbnb-typescript eslint-config-prettier eslint-import-resolver-typescript
```

- [ ] **Step 2: Install admin devDependencies**

```bash
cd D:/projects/agent-erp && pnpm --filter @erp/admin add -D eslint-config-airbnb eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y
```

- [ ] **Step 3: Verify packages are listed in package.json files**

```bash
cd D:/projects/agent-erp && node -e "const p = require('./package.json'); console.log(Object.keys(p.devDependencies).filter(k=>k.includes('eslint')||k.includes('airbnb')||k.includes('prettier')||k.includes('import')))"
cd D:/projects/agent-erp && node -e "const p = require('./packages/admin/package.json'); console.log(Object.keys(p.devDependencies).filter(k=>k.includes('eslint')||k.includes('react')))"
```

- [ ] **Step 4: Commit**

```bash
cd D:/projects/agent-erp && git add package.json pnpm-lock.yaml packages/admin/package.json && git commit -m "chore: add Airbnb ESLint dependencies"
```

---

### Task 2: Rewrite root .eslintrc.json

**Files:**
- Modify: `.eslintrc.json`

- [ ] **Step 1: Write the new config**

Write `D:\projects\agent-erp\.eslintrc.json`:

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json",
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "extends": [
    "airbnb-base",
    "airbnb-typescript/base",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": "off",
    "no-param-reassign": "off",
    "import/prefer-default-export": "off",
    "import/no-extraneous-dependencies": "off",
    "class-methods-use-this": "off",
    "max-classes-per-file": "off",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }]
  },
  "settings": {
    "import/resolver": {
      "typescript": {}
    }
  },
  "ignorePatterns": ["dist/", "node_modules/", "*.js", "*.mjs"]
}
```

- [ ] **Step 2: Verify config loads without crash**

```bash
cd D:/projects/agent-erp && npx eslint packages/core/src/module-registry.ts --max-warnings=100 2>&1 | head -30
```

Expected: Lint runs. Rule errors OK. Config parse errors NOT OK.

- [ ] **Step 3: Commit**

```bash
cd D:/projects/agent-erp && git add .eslintrc.json && git commit -m "config: switch to Airbnb base + TypeScript ESLint rules"
```

---

### Task 3: Create admin .eslintrc.json

**Files:**
- Create: `packages/admin/.eslintrc.json`

- [ ] **Step 1: Write the admin config**

Write `D:\projects\agent-erp\packages\admin\.eslintrc.json`:

```json
{
  "extends": [
    "../../.eslintrc.json",
    "airbnb",
    "airbnb-typescript"
  ],
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/jsx-filename-extension": ["error", { "extensions": [".tsx"] }],
    "react/require-default-props": "off",
    "react/function-component-definition": ["error", {
      "namedComponents": "arrow-function",
      "unnamedComponents": "arrow-function"
    }]
  }
}
```

- [ ] **Step 2: Verify config loads via admin file**

```bash
cd D:/projects/agent-erp && npx eslint packages/admin/src/store.ts --max-warnings=100 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
cd D:/projects/agent-erp && git add packages/admin/.eslintrc.json && git commit -m "config: add Airbnb React ESLint rules for admin package"
```

---

### Task 4: Configure pre-commit hook (husky + lint-staged)

**Files:**
- Create: `.lintstagedrc.json`
- Create: `.husky/pre-commit`

- [ ] **Step 1: Install husky and lint-staged**

```bash
cd D:/projects/agent-erp && pnpm add -D -w husky lint-staged
```

- [ ] **Step 2: Initialize husky**

```bash
cd D:/projects/agent-erp && npx husky init
```

- [ ] **Step 3: Write .lintstagedrc.json**

Write `D:\projects\agent-erp\.lintstagedrc.json`:

```json
{
  "*.{ts,tsx}": ["eslint --fix --max-warnings=0"]
}
```

- [ ] **Step 4: Write .husky/pre-commit**

Write `D:\projects\agent-erp\.husky\pre-commit`:

```
npx lint-staged
```

- [ ] **Step 5: Commit**

```bash
cd D:/projects/agent-erp && git add .lintstagedrc.json .husky/pre-commit package.json pnpm-lock.yaml && git commit -m "chore: add husky + lint-staged pre-commit hook"
```

---

### Task 5: Auto-fix all auto-fixable errors

**Files:** (auto-detected by ESLint)

- [ ] **Step 1: Run auto-fix across the project**

```bash
cd D:/projects/agent-erp && pnpm lint -- --fix 2>&1
```

- [ ] **Step 2: Check remaining errors**

```bash
cd D:/projects/agent-erp && pnpm lint 2>&1
```

Expected: Only errors that cannot be auto-fixed remain. Auto-fix should handle unused vars, import ordering, and formatting.

- [ ] **Step 3: Commit**

```bash
cd D:/projects/agent-erp && git add -u && git commit -m "fix: auto-fix ESLint errors (imports, formatting, unused vars)"
```

---

### Task 6: Fix user_controller.ts (7 `any` + unused vars)

**Files:**
- Modify: `modules/base/controllers/user_controller.ts`

- [ ] **Step 1: Apply four fixes to replace `any` with `Record<string, unknown>`, remove unused `groups`, rename unused destructured `password` to `_password`**

**Fix 1 — `list()`:**
```typescript
// OLD:
async list(ctx: { uid: number }) {
  const records = await envWithContext('res.users', { uid: ctx.uid }).search([]);
  return records.map((r: any) => {
    const { password, ...safe } = r;
    return safe;
  });
}
// NEW:
async list(ctx: { uid: number }) {
  const records = await envWithContext('res.users', { uid: ctx.uid }).search([]);
  return records.map((r: Record<string, unknown>) => {
    const { password: _password, ...safe } = r;
    return safe;
  });
}
```

**Fix 2 — `detail()`:**
```typescript
// OLD:
if (record) {
  const { password, ...safe } = record as any;
  return safe;
}
// NEW:
if (record) {
  const { password: _password, ...safe } = record as Record<string, unknown>;
  return safe;
}
```

**Fix 3 — `create()`:**
```typescript
// OLD:
async create(ctx: { uid: number; body: Record<string, unknown> }) {
  const { password, groups, ...rest } = ctx.body;
  if (password && typeof password === 'string' && password.length > 0) {
    (rest as any).password = await hashPassword(password);
  }
  const created = await envWithContext('res.users', { uid: ctx.uid }).create(rest);
  const { password: _, ...safe } = created as any;
  return safe;
}
// NEW:
async create(ctx: { uid: number; body: Record<string, unknown> }) {
  const { password, ...rest } = ctx.body;
  if (password && typeof password === 'string' && password.length > 0) {
    (rest as Record<string, unknown>).password = await hashPassword(password);
  }
  const created = await envWithContext('res.users', { uid: ctx.uid }).create(rest);
  const { password: _password, ...safe } = created as Record<string, unknown>;
  return safe;
}
```

**Fix 4 — `update()`:**
```typescript
// OLD:
async update(ctx: { uid: number; params: { id: string }; body: Record<string, unknown> }) {
  const { password, groups, ...rest } = ctx.body;
  if (password && typeof password === 'string' && password.length > 0) {
    (rest as any).password = await hashPassword(password);
  }
  const result = await envWithContext('res.users', { uid: ctx.uid })
    .write([parseInt(ctx.params.id)], rest);
  if (result) {
    const { password: _, ...safe } = result as any;
    return safe;
  }
  return result;
}
// NEW:
async update(ctx: { uid: number; params: { id: string }; body: Record<string, unknown> }) {
  const { password, ...rest } = ctx.body;
  if (password && typeof password === 'string' && password.length > 0) {
    (rest as Record<string, unknown>).password = await hashPassword(password);
  }
  const result = await envWithContext('res.users', { uid: ctx.uid })
    .write([parseInt(ctx.params.id)], rest);
  if (result) {
    const { password: _password, ...safe } = result as Record<string, unknown>;
    return safe;
  }
  return result;
}
```

- [ ] **Step 2: Verify file passes lint**

```bash
cd D:/projects/agent-erp && npx eslint modules/base/controllers/user_controller.ts 2>&1
```

Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
cd D:/projects/agent-erp && git add modules/base/controllers/user_controller.ts && git commit -m "fix: remove any types and unused vars in user_controller"
```

---

### Task 7: Fix module-scanner.ts and module-registry.ts (4 + 1 `any`)

**Files:**
- Modify: `packages/core/src/module-scanner.ts`
- Modify: `packages/core/src/module-registry.ts`

- [ ] **Step 1: Fix module-scanner.ts — ModuleLoader interface + runModuleSeeds param**

**Fix 1 — ModuleLoader return type:**
```typescript
// OLD:
loadIndex(modulePath: string): Promise<{
  models?: any[];
  controllers?: any[];
  data?: any[];
}>;
// NEW:
loadIndex(modulePath: string): Promise<{
  models?: Record<string, unknown>[];
  controllers?: Record<string, unknown>[];
  data?: ((knex: Record<string, unknown>) => Promise<void>)[];
}>;
```

**Fix 2 — runModuleSeeds param:**
```typescript
// OLD:
export async function runModuleSeeds(moduleNames: string[], knex: any): Promise<void> {
// NEW:
export async function runModuleSeeds(moduleNames: string[], knex: Record<string, unknown>): Promise<void> {
```

- [ ] **Step 2: Fix module-registry.ts — dataFiles type**

```typescript
// OLD:
dataFiles: Array<(knex: any) => Promise<void>>;
// NEW:
dataFiles: Array<(knex: Record<string, unknown>) => Promise<void>>;
```

- [ ] **Step 3: Verify both files pass lint**

```bash
cd D:/projects/agent-erp && npx eslint packages/core/src/module-scanner.ts packages/core/src/module-registry.ts 2>&1
```

Expected: Zero errors.

- [ ] **Step 4: Commit**

```bash
cd D:/projects/agent-erp && git add packages/core/src/module-scanner.ts packages/core/src/module-registry.ts && git commit -m "fix: remove any types in module scanner and registry"
```

---

### Task 8: Fix admin e2e test (6 `any`)

**Files:**
- Modify: `packages/admin/e2e/admin.spec.ts`

- [ ] **Step 1: Fix `setState` helper**

```typescript
// OLD:
async function setState(page: any, state: Record<string, unknown>) {
  await page.evaluate((s: any) => {
    const store = (window as any).__STORE__;
    store.setState(s);
  }, state);
}
// NEW:
async function setState(page: import('@playwright/test').Page, state: Record<string, unknown>) {
  await page.evaluate((s: Record<string, unknown>) => {
    const store = (window as unknown as { __STORE__: { setState: (v: unknown) => void } }).__STORE__;
    store.setState(s);
  }, state);
}
```

- [ ] **Step 2: Fix `window as any` in menu click test (line ~108)**

```typescript
// OLD:
const activeMenuId = await page.evaluate(() => {
  return (window as any).__STORE__.getState().activeMenuId;
});
// NEW:
const activeMenuId: string | null = await page.evaluate(() =>
  (window as unknown as { __STORE__: { getState: () => { activeMenuId: string | null } } }).__STORE__.getState().activeMenuId);
```

- [ ] **Step 3: Fix intentional test `as any` — keep with eslint-disable comment**

```typescript
// OLD:
id: 'bad.test', model: 'res.partner', type: 'unknown_type' as any,
// NEW:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
id: 'bad.test', model: 'res.partner', type: 'unknown_type' as any,
```

- [ ] **Step 4: Fix `window as any` in collapse test (line ~284)**

```typescript
// OLD:
const collapsed = await page.evaluate(() =>
  (window as any).__STORE__.getState().siderCollapsed
);
// NEW:
const collapsed: boolean = await page.evaluate(() =>
  (window as unknown as { __STORE__: { getState: () => { siderCollapsed: boolean } } }).__STORE__.getState().siderCollapsed);
```

- [ ] **Step 5: Verify file passes lint**

```bash
cd D:/projects/agent-erp && npx eslint packages/admin/e2e/admin.spec.ts 2>&1
```

Expected: Zero errors.

- [ ] **Step 6: Commit**

```bash
cd D:/projects/agent-erp && git add packages/admin/e2e/admin.spec.ts && git commit -m "fix: remove any types in admin e2e tests"
```

---

### Task 9: Fix vite.config.ts (5 `any` + 1 unused var)

**Files:**
- Modify: `packages/admin/vite.config.ts`

- [ ] **Step 1: Fix `server: any` (line 9)**

```typescript
// OLD:
configureServer(server: any) {
// NEW:
configureServer(server: import('vite').ViteDevServer) {
```

- [ ] **Step 2: Fix unused `moduleNames` (line 39) — remove assignment**

```typescript
// OLD:
const moduleNames = await scanModules({ modulesPath }, loader);
// NEW:
await scanModules({ modulesPath }, loader);
```

- [ ] **Step 3: Fix `r: any` in groupRows.map calls (lines 90, 94)**

```typescript
// OLD:
const token = signToken({ userId: user.id, groups: groupRows.map((r: any) => String(r.group_id)) });
// ...
user: { id: user.id, name: user.name, groups: groupRows.map((r: any) => String(r.group_id)) },
// NEW:
const groups = groupRows.map((r: { group_id: unknown }) => String(r.group_id));
const token = signToken({ userId: user.id, groups });
// ...
user: { id: user.id, name: user.name, groups },
```

- [ ] **Step 4: Fix `Ctrl as any` (line 120)**

```typescript
// OLD:
const routes = (Ctrl as any).routes;
// NEW:
const routes = (Ctrl as unknown as {
  routes?: Array<{ path: string; method: string; handler: string }>;
}).routes;
```

- [ ] **Step 5: Verify file passes lint**

```bash
cd D:/projects/agent-erp && npx eslint packages/admin/vite.config.ts 2>&1
```

Expected: Zero errors.

- [ ] **Step 6: Commit**

```bash
cd D:/projects/agent-erp && git add packages/admin/vite.config.ts && git commit -m "fix: remove any types and unused var in vite.config.ts"
```

---

### Task 10: Fix LoginPage.tsx and store.ts (1 `any` + 1 unused import)

**Files:**
- Modify: `packages/admin/src/components/LoginPage.tsx`
- Modify: `packages/admin/src/store.ts`

- [ ] **Step 1: Fix LoginPage.tsx — replace `e: any` with `unknown`**

```typescript
// OLD:
} catch (e: any) {
  setError(e.message ?? 'Login failed');
  setShake(true);
  setTimeout(() => setShake(false), 500);
}
// NEW:
} catch (e: unknown) {
  setError(e instanceof Error ? e.message : 'Login failed');
  setShake(true);
  setTimeout(() => setShake(false), 500);
}
```

- [ ] **Step 2: Fix store.ts — remove unused `ViewSpec` import**

```typescript
// OLD:
import type { MenuItem, ViewSpec, AppState, BreadcrumbItem } from './types';
// NEW:
import type { MenuItem, AppState, BreadcrumbItem } from './types';
```

- [ ] **Step 3: Verify both files pass lint**

```bash
cd D:/projects/agent-erp && npx eslint packages/admin/src/components/LoginPage.tsx packages/admin/src/store.ts 2>&1
```

Expected: Zero errors.

- [ ] **Step 4: Commit**

```bash
cd D:/projects/agent-erp && git add packages/admin/src/components/LoginPage.tsx packages/admin/src/store.ts && git commit -m "fix: remove any in LoginPage and unused import in store"
```

---

### Task 11: Fix remaining test file unused vars

**Files:**
- Modify: `packages/admin/e2e/dashboard.spec.ts`
- Modify: `packages/admin/e2e/login.spec.ts`
- Modify: `packages/data/src/__tests__/migration-runner.test.ts`
- Modify: `packages/domain/src/__tests__/registry.test.ts`

- [ ] **Step 1: Fix dashboard.spec.ts — prefix unused `page` params with `_`, remove unused `expect` import**

```typescript
// OLD:
import { test, expect } from '@playwright/test';
// ...
test('shows greeting after login', async ({ page }) => {
test('renders stat cards', async ({ page }) => {
test('renders quick action pills', async ({ page }) => {
// NEW:
import { test } from '@playwright/test';
// ...
test('shows greeting after login', async ({ page: _page }) => {
test('renders stat cards', async ({ page: _page }) => {
test('renders quick action pills', async ({ page: _page }) => {
```

- [ ] **Step 2: Fix login.spec.ts — prefix unused `page` param**

```typescript
// OLD:
test('logs out and returns to login', async ({ page }) => {
// NEW:
test('logs out and returns to login', async ({ page: _page }) => {
```

- [ ] **Step 3: Fix migration-runner.test.ts — remove unused `MockFn` type alias (line 4)**

Remove:
```typescript
type MockFn = ReturnType<typeof vi.fn>;
```

- [ ] **Step 4: Fix registry.test.ts — remove unused `getModelRegistry` import**

```typescript
// OLD:
import { ModelRegistry, getModelRegistry } from '../registry';
// NEW:
import { ModelRegistry } from '../registry';
```

- [ ] **Step 5: Verify all files pass lint**

```bash
cd D:/projects/agent-erp && npx eslint packages/admin/e2e/dashboard.spec.ts packages/admin/e2e/login.spec.ts packages/data/src/__tests__/migration-runner.test.ts packages/domain/src/__tests__/registry.test.ts 2>&1
```

Expected: Zero errors.

- [ ] **Step 6: Commit**

```bash
cd D:/projects/agent-erp && git add packages/admin/e2e/dashboard.spec.ts packages/admin/e2e/login.spec.ts packages/data/src/__tests__/migration-runner.test.ts packages/domain/src/__tests__/registry.test.ts && git commit -m "fix: remove unused vars in test files"
```

---

### Task 12: Final verification — full project lint with zero errors

- [ ] **Step 1: Run full lint**

```bash
cd D:/projects/agent-erp && pnpm lint 2>&1
```

Expected: Zero errors, zero warnings.

- [ ] **Step 2: Run tests to verify no regressions**

```bash
cd D:/projects/agent-erp && pnpm test 2>&1
```

Expected: All tests pass.

- [ ] **Step 3: Run type-check on backend packages**

```bash
cd D:/projects/agent-erp && pnpm --filter @erp/core exec tsc --noEmit && pnpm --filter @erp/domain exec tsc --noEmit && pnpm --filter @erp/data exec tsc --noEmit 2>&1
```

Expected: No type errors.

- [ ] **Step 4: Final commit if any remaining fixes needed**

```bash
cd D:/projects/agent-erp && git add -u && git diff --cached --quiet || git commit -m "chore: final lint pass — zero errors"
```
