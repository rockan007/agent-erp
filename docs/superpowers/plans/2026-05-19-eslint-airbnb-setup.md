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

- [ ] **Step 3: Verify install — check package.json files have the new entries**

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

- [ ] **Step 2: Verify config is valid JSON**

```bash
cd D:/projects/agent-erp && node -e "JSON.parse(require('fs').readFileSync('.eslintrc.json','utf8')); console.log('OK')"
```

- [ ] **Step 3: Run lint against a backend package to verify it loads**

```bash
cd D:/projects/agent-erp && npx eslint packages/core/src/module-registry.ts --max-warnings=100 2>&1 | head -30
```

Expected: Lint runs without config errors (lint rule errors are OK, crash/config error is NOT).

- [ ] **Step 4: Commit**

```bash
cd D:/projects/agent-erp && git add .eslintrc.json && git commit -m "config: switch to Airbnb base + TypeScript ESLint rules"
```

---

### Task 3: Create admin .eslintrc.json

**Files:**
- Create: `packages/admin/.eslintrc.json`

- [ ] **Step 1: Create the admin config file**

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

- [ ] **Step 2: Run lint against an admin file to verify it loads**

```bash
cd D:/projects/agent-erp && npx eslint packages/admin/src/store.ts --max-warnings=100 2>&1 | head -30
```

Expected: Config loads without errors.

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

```bash
npx lint-staged
```

- [ ] **Step 5: Mark pre-commit executable (if on Unix)**

```bash
chmod +x D:/projects/agent-erp/.husky/pre-commit 2>/dev/null; echo "done"
```

- [ ] **Step 6: Commit**

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

Expected: Only errors that cannot be auto-fixed remain (~26 errors, mostly `no-explicit-any`). Auto-fix should have handled unused vars, import ordering, and formatting.

- [ ] **Step 3: Commit**

```bash
cd D:/projects/agent-erp && git add -u && git commit -m "fix: auto-fix ESLint errors (imports, formatting, unused vars)"
```

---

### Task 6: Fix user_controller.ts (7 `any` + 4 unused vars)

**Files:**
- Modify: `modules/base/controllers/user_controller.ts`

- [ ] **Step 1: Edit the file — replace `any` with proper types and remove unused vars**

Edit `D:\projects\agent-erp\modules\base\controllers\user_controller.ts`:

Old lines 13-18:
```typescript
  async list(ctx: { uid: number }) {
    const records = await envWithContext('res.users', { uid: ctx.uid }).search([]);
    return records.map((r: any) => {
      const { password, ...safe } = r;
      return safe;
    });
  }
```

New:
```typescript
  async list(ctx: { uid: number }) {
    const records = await envWithContext('res.users', { uid: ctx.uid }).search([]);
    return records.map((r: Record<string, unknown>) => {
      const { password: _password, ...safe } = r;
      return safe;
    });
  }
```

Old lines 21-30:
```typescript
  async detail(ctx: { uid: number; params: { id: string } }) {
    const records = await envWithContext('res.users', { uid: ctx.uid })
      .browse([parseInt(ctx.params.id)]);
    const record = records[0] ?? null;
    if (record) {
      const { password, ...safe } = record as any;
      return safe;
    }
    return null;
  }
```

New:
```typescript
  async detail(ctx: { uid: number; params: { id: string } }) {
    const records = await envWithContext('res.users', { uid: ctx.uid })
      .browse([parseInt(ctx.params.id)]);
    const record = records[0] ?? null;
    if (record) {
      const { password: _password, ...safe } = record as Record<string, unknown>;
      return safe;
    }
    return null;
  }
```

Old lines 32-39:
```typescript
  async create(ctx: { uid: number; body: Record<string, unknown> }) {
    const { password, groups, ...rest } = ctx.body;
    if (password && typeof password === 'string' && password.length > 0) {
      (rest as any).password = await hashPassword(password);
    }
    const created = await envWithContext('res.users', { uid: ctx.uid }).create(rest);
    const { password: _, ...safe } = created as any;
    return safe;
  }
```

New:
```typescript
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

Old lines 42-53:
```typescript
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
```

New:
```typescript
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

- [ ] **Step 2: Verify this file passes lint**

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

- [ ] **Step 1: Fix module-scanner.ts — replace `any` in ModuleLoader return type and runModuleSeeds param**

Edit `D:\projects\agent-erp\packages\core\src\module-scanner.ts`:

Old lines 44-51:
```typescript
export interface ModuleLoader {
  loadManifest(modulePath: string): Promise<ModuleManifest>;
  loadIndex(modulePath: string): Promise<{
    models?: any[];
    controllers?: any[];
    data?: any[];
  }>;
}
```

New:
```typescript
export interface ModuleLoader {
  loadManifest(modulePath: string): Promise<ModuleManifest>;
  loadIndex(modulePath: string): Promise<{
    models?: Record<string, unknown>[];
    controllers?: Record<string, unknown>[];
    data?: ((knex: Record<string, unknown>) => Promise<void>)[];
  }>;
}
```

Old line 98:
```typescript
export async function runModuleSeeds(moduleNames: string[], knex: any): Promise<void> {
```

New:
```typescript
export async function runModuleSeeds(moduleNames: string[], knex: Record<string, unknown>): Promise<void> {
```

- [ ] **Step 2: Fix module-registry.ts — replace `any` in ModuleDefinition.dataFiles**

Edit `D:\projects\agent-erp\packages\core\src\module-registry.ts`:

Old line 27:
```typescript
  dataFiles: Array<(knex: any) => Promise<void>>;
```

New:
```typescript
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

### Task 8: Fix admin/spec.ts e2e test (6 `any`)

**Files:**
- Modify: `packages/admin/e2e/admin.spec.ts`

- [ ] **Step 1: Fix the `setState` helper and `window as any` usages**

Edit `D:\projects\agent-erp\packages\admin\e2e\admin.spec.ts`:

Old lines 53-59:
```typescript
// Helper: inject Zustand state in the browser
async function setState(page: any, state: Record<string, unknown>) {
  await page.evaluate((s: any) => {
    const store = (window as any).__STORE__;
    store.setState(s);
  }, state);
}
```

New:
```typescript
// Helper: inject Zustand state in the browser
async function setState(page: import('@playwright/test').Page, state: Record<string, unknown>) {
  await page.evaluate((s: Record<string, unknown>) => {
    const store = (window as unknown as { __STORE__: { setState: (v: unknown) => void } }).__STORE__;
    store.setState(s);
  }, state);
}
```

Old line 108:
```typescript
      return (window as any).__STORE__.getState().activeMenuId;
```

New:
```typescript
      return (window as unknown as { __STORE__: { getState: () => { activeMenuId: string | null } } }).__STORE__.getState().activeMenuId;
```

Old line 241:
```typescript
        id: 'bad.test', model: 'res.partner', type: 'unknown_type' as any,
```

New:
```typescript
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: 'bad.test', model: 'res.partner', type: 'unknown_type' as any,
```

Old lines 283-284:
```typescript
    const collapsed = await page.evaluate(() =>
      (window as any).__STORE__.getState().siderCollapsed
    );
```

New:
```typescript
    const collapsed = await page.evaluate(() =>
      (window as unknown as { __STORE__: { getState: () => { siderCollapsed: boolean } } }).__STORE__.getState().siderCollapsed,
    );
```

- [ ] **Step 2: Verify this file passes lint**

```bash
cd D:/projects/agent-erp && npx eslint packages/admin/e2e/admin.spec.ts 2>&1
```

Expected: Zero errors (only the one `eslint-disable` line for intentional `as any` test case).

- [ ] **Step 3: Commit**

```bash
cd D:/projects/agent-erp && git add packages/admin/e2e/admin.spec.ts && git commit -m "fix: remove any types in admin e2e tests"
```

---

### Task 9: Fix vite.config.ts (5 `any` + 1 unused var)

**Files:**
- Modify: `packages/admin/vite.config.ts`

- [ ] **Step 1: Fix the vite config**

Edit `D:\projects\agent-erp\packages\admin\vite.config.ts`:

Old line 9:
```typescript
    configureServer(server: any) {
```

New:
```typescript
    configureServer(server: import('vite').ViteDevServer) {
```

Old lines 39 (remove the unused `moduleNames` variable):
```typescript
          const moduleNames = await scanModules({ modulesPath }, loader);

          const order = getModuleRegistry().resolveDependencies();
```

New:
```typescript
          const moduleNames = await scanModules({ modulesPath }, loader);

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const order = getModuleRegistry().resolveDependencies();
```

Wait — `moduleNames` is also used on line 53 (`runModuleSeeds(order, knex)`), so it IS used. The lint error is about `moduleNames` on line 39 — but it's used in `installModules(order)` on line 42. Wait, let me re-check...

Looking at the original error: line 39 `'moduleNames' is assigned a value but never used`. But `moduleNames` is used on line 42 as `installModules(order)` — wait, that uses `order` not `moduleNames`.

OK so `moduleNames` is assigned but only `order` is used after. Actually `moduleNames` IS used: `console.log` on line 53 and `runModuleSeeds(order, knex)`. Hmm wait this is confusing. Let me look at the original code again.

Lines 39-53:
```
39:          const moduleNames = await scanModules({ modulesPath }, loader);
40:
41:          const order = getModuleRegistry().resolveDependencies();
42:          await installModules(order);
...
51:          await runModuleSeeds(order, knex);
52:
53:          console.log(`[erp] Modules installed: ${order.join(', ')}`);
```

Wait, `installModules` takes `moduleNames` originally but the code passes `order`? No wait, let me look at line 42 more carefully...

Actually from the original code at line 42: `await installModules(order);` — and `moduleNames` on line 39. The variable `moduleNames` is NOT used anywhere else in the function after being assigned. Lines 51 uses `order`, line 53 also uses `order`.

So `moduleNames` IS unused! But `installModules` expects `(moduleNames: string[])` — and it's being called with `order`. This seems like a potential bug where `moduleNames` should be passed instead of `order`. But that's a logic issue, not a lint issue. For this task, we just need to fix the lint error.

Let me update the plan accordingly: prefix `moduleNames` with `_` or add eslint-disable.

Actually, this could be intentional — they might want to use `order` (dependency-resolved order) rather than the raw scan order. So I'll just prefix with `_`.

Let me re-think the vite.config.ts fixes properly.

Old lines 39-41:
```typescript
          const moduleNames = await scanModules({ modulesPath }, loader);
```

Since `moduleNames` is unused, remove the variable assignment:
```typescript
          await scanModules({ modulesPath }, loader);
```

Old lines 90, 94 (the `r: any` inline type annotations):
```typescript
            const token = signToken({ userId: user.id, groups: groupRows.map((r: any) => String(r.group_id)) });
```
and
```typescript
              user: { id: user.id, name: user.name, groups: groupRows.map((r: any) => String(r.group_id)) },
```

We need a type for `groupRows`. Knex query results return `unknown`-like types. We can type `r` as `{ group_id: unknown }`.

New:
```typescript
            const token = signToken({ userId: user.id, groups: groupRows.map((r: { group_id: unknown }) => String(r.group_id)) });
```
and
```typescript
              user: { id: user.id, name: user.name, groups: groupRows.map((r: { group_id: unknown }) => String(r.group_id)) },
```

Line 120:
```typescript
              const routes = (Ctrl as any).routes;
```

New:
```typescript
              const routes = (Ctrl as unknown as { routes?: RouteDefinition[] }).routes;
```

Wait, but RouteDefinition is defined in module-registry.ts. Let me check if it's exported... Yes, it's exported from `@erp/core`. But we're inside vite.config.ts which imports from `@erp/core` via `ssrLoadModule`. Let me check the imports.

From line 15-16:
```typescript
const { scanModules, installModules, runModuleSeeds, getModuleRegistry } =
  await server.ssrLoadModule('@erp/core');
```

But RouteDefinition isn't imported. We could add it to the import... but the import is dynamic. Actually let me just use an inline type:

```typescript
const routes = (Ctrl as unknown as { routes?: Array<{ path: string; method: string; handler: string }> }).routes;
```

That's getting verbose. Alternatively, add `RouteDefinition` to the ssrLoadModule import. But changing the import might break things. Let me keep it simple with inline type.

Actually, for a dynamic import, we can just import RouteDefinition separately. But this is the vite config, not a module file. Let me just use a clean inline type.

Let me now accurately write the fix for vite.config.ts:

1. Line 9: `server: any` → `server: import('vite').ViteDevServer`
2. Line 39: Remove unused `moduleNames` → just `await scanModules(...)` (don't assign)
3. Line 90: `r: any` → `r: { group_id: unknown }`
4. Line 94: `r: any` → `r: { group_id: unknown }`
5. Line 120: `Ctrl as any` → `Ctrl as unknown as { routes?: Array<{ path: string; method: string; handler: string }> }`

These are precise and minimal fixes. Let me rewrite the plan section.<｜end▁of▁thinking｜>Now I need to write the complete plan. Let me save it.

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="Write">
<｜｜DSML｜｜parameter name="content" string="true"># ESLint Airbnb Setup Implementation Plan

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

- [ ] **Step 3: Verify packages are listed**

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

Expected: Config loads, rule errors are OK.

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

```bash
npx lint-staged
```

- [ ] **Step 5: Mark pre-commit executable (no-op on Windows, needed for CI/Unix)**

```bash
chmod +x D:/projects/agent-erp/.husky/pre-commit 2>/dev/null; echo "done"
```

- [ ] **Step 6: Commit**

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

- [ ] **Step 2: Check remaining errors (should be ~26, mostly no-explicit-any)**

```bash
cd D:/projects/agent-erp && pnpm lint 2>&1
```

Expected: Only errors that cannot be auto-fixed remain. Auto-fix should handle unused vars, import ordering, formatting, and destructuring patterns.

- [ ] **Step 3: Commit**

```bash
cd D:/projects/agent-erp && git add -u && git commit -m "fix: auto-fix ESLint errors (imports, formatting, unused vars)"
```

---

### Task 6: Fix user_controller.ts (7 `any` + unused vars)

**Files:**
- Modify: `modules/base/controllers/user_controller.ts`

- [ ] **Step 1: Replace `r: any` with `Record<string, unknown>`, fix unused `password` destructure in `list()`**

Old lines 13-18:
```typescript
  async list(ctx: { uid: number }) {
    const records = await envWithContext('res.users', { uid: ctx.uid }).search([]);
    return records.map((r: any) => {
      const { password, ...safe } = r;
      return safe;
    });
  }
```

New:
```typescript
  async list(ctx: { uid: number }) {
    const records = await envWithContext('res.users', { uid: ctx.uid }).search([]);
    return records.map((r: Record<string, unknown>) => {
      const { password: _password, ...safe } = r;
      return safe;
    });
  }
```

- [ ] **Step 2: Fix `detail()` — same pattern**

Old lines 21-30:
```typescript
  async detail(ctx: { uid: number; params: { id: string } }) {
    const records = await envWithContext('res.users', { uid: ctx.uid })
      .browse([parseInt(ctx.params.id)]);
    const record = records[0] ?? null;
    if (record) {
      const { password, ...safe } = record as any;
      return safe;
    }
    return null;
  }
```

New:
```typescript
  async detail(ctx: { uid: number; params: { id: string } }) {
    const records = await envWithContext('res.users', { uid: ctx.uid })
      .browse([parseInt(ctx.params.id)]);
    const record = records[0] ?? null;
    if (record) {
      const { password: _password, ...safe } = record as Record<string, unknown>;
      return safe;
    }
    return null;
  }
```

- [ ] **Step 3: Fix `create()` — remove unused `groups`, replace `as any`**

Old lines 32-39:
```typescript
  async create(ctx: { uid: number; body: Record<string, unknown> }) {
    const { password, groups, ...rest } = ctx.body;
    if (password && typeof password === 'string' && password.length > 0) {
      (rest as any).password = await hashPassword(password);
    }
    const created = await envWithContext('res.users', { uid: ctx.uid }).create(rest);
    const { password: _, ...safe } = created as any;
    return safe;
  }
```

New:
```typescript
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

- [ ] **Step 4: Fix `update()` — same pattern as create**

Old lines 42-53:
```typescript
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
```

New:
```typescript
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

- [ ] **Step 5: Verify**

```bash
cd D:/projects/agent-erp && npx eslint modules/base/controllers/user_controller.ts 2>&1
```

Expected: Zero errors.

- [ ] **Step 6: Commit**

```bash
cd D:/projects/agent-erp && git add modules/base/controllers/user_controller.ts && git commit -m "fix: remove any types and unused vars in user_controller"
```

---

### Task 7: Fix module-scanner.ts and module-registry.ts (4 + 1 `any`)

**Files:**
- Modify: `packages/core/src/module-scanner.ts`
- Modify: `packages/core/src/module-registry.ts`

- [ ] **Step 1: Fix module-scanner.ts — ModuleLoader interface return types + runModuleSeeds param**

Edit `D:\projects\agent-erp\packages\core\src\module-scanner.ts`:

Old lines 44-51:
```typescript
export interface ModuleLoader {
  loadManifest(modulePath: string): Promise<ModuleManifest>;
  loadIndex(modulePath: string): Promise<{
    models?: any[];
    controllers?: any[];
    data?: any[];
  }>;
}
```

New:
```typescript
export interface ModuleLoader {
  loadManifest(modulePath: string): Promise<ModuleManifest>;
  loadIndex(modulePath: string): Promise<{
    models?: Record<string, unknown>[];
    controllers?: Record<string, unknown>[];
    data?: ((knex: Record<string, unknown>) => Promise<void>)[];
  }>;
}
```

Old line 98:
```typescript
export async function runModuleSeeds(moduleNames: string[], knex: any): Promise<void> {
```

New:
```typescript
export async function runModuleSeeds(moduleNames: string[], knex: Record<string, unknown>): Promise<void> {
```

- [ ] **Step 2: Fix module-registry.ts — dataFiles type**

Edit `D:\projects\agent-erp\packages\core\src\module-registry.ts`:

Old line 27:
```typescript
  dataFiles: Array<(knex: any) => Promise<void>>;
```

New:
```typescript
  dataFiles: Array<(knex: Record<string, unknown>) => Promise<void>>;
```

- [ ] **Step 3: Verify**

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

- [ ] **Step 1: Fix `setState` helper — replace `page: any` and `window as any`**

Old lines 53-59:
```typescript
// Helper: inject Zustand state in the browser
async function setState(page: any, state: Record<string, unknown>) {
  await page.evaluate((s: any) => {
    const store = (window as any).__STORE__;
    store.setState(s);
  }, state);
}
```

New:
```typescript
// Helper: inject Zustand state in the browser
async function setState(page: import('@playwright/test').Page, state: Record<string, unknown>) {
  await page.evaluate((s: Record<string, unknown>) => {
    const store = (window as unknown as { __STORE__: { setState: (v: unknown) => void } }).__STORE__;
    store.setState(s);
  }, state);
}
```

- [ ] **Step 2: Fix `window as any` in menu click test (line 108)**

Old lines 107-108:
```typescript
    const activeMenuId = await page.evaluate(() => {
      return (window as any).__STORE__.getState().activeMenuId;
    });
```

New:
```typescript
    const activeMenuId: string | null = await page.evaluate(() =>
      (window as unknown as { __STORE__: { getState: () => { activeMenuId: string | null } } }).__STORE__.getState().activeMenuId);
```

- [ ] **Step 3: Fix intentional `as any` for unknown view type test (line 241) — keep with eslint-disable**

Old line 241:
```typescript
        id: 'bad.test', model: 'res.partner', type: 'unknown_type' as any,
```

New:
```typescript
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: 'bad.test', model: 'res.partner', type: 'unknown_type' as any,
```

- [ ] **Step 4: Fix `window as any` in collapse test (line 284)**

Old lines 283-285:
```typescript
    const collapsed = await page.evaluate(() =>
      (window as any).__STORE__.getState().siderCollapsed
    );
```

New:
```typescript
    const collapsed: boolean = await page.evaluate(() =>
      (window as unknown as { __STORE__: { getState: () => { siderCollapsed: boolean } } }).__STORE__.getState().siderCollapsed);
```

- [ ] **Step 5: Verify**

```bash
cd D:/projects/agent-erp && npx eslint packages/admin/e2e/admin.spec.ts 2>&1
```

Expected: Zero errors (one intentional `eslint-disable` for the test case).

- [ ] **Step 6: Commit**

```bash
cd D:/projects/agent-erp && git add packages/admin/e2e/admin.spec.ts && git commit -m "fix: remove any types in admin e2e tests"
```

---

### Task 9: Fix vite.config.ts (5 `any` + 1 unused var)

**Files:**
- Modify: `packages/admin/vite.config.ts`

- [ ] **Step 1: Fix `server: any` in configureServer (line 9)**

Old:
```typescript
    configureServer(server: any) {
```

New:
```typescript
    configureServer(server: import('vite').ViteDevServer) {
```

- [ ] **Step 2: Fix unused `moduleNames` (line 39)**

Old:
```typescript
          const moduleNames = await scanModules({ modulesPath }, loader);
```

New (remove assignment, we don't use the return value):
```typescript
          await scanModules({ modulesPath }, loader);
```

- [ ] **Step 3: Fix `r: any` in groupRows.map calls (lines 90, 94)**

Old lines 90-95:
```typescript
            const token = signToken({ userId: user.id, groups: groupRows.map((r: any) => String(r.group_id)) });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              token,
              user: { id: user.id, name: user.name, groups: groupRows.map((r: any) => String(r.group_id)) },
            }));
```

New:
```typescript
            const groups = groupRows.map((r: { group_id: unknown }) => String(r.group_id));
            const token = signToken({ userId: user.id, groups });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              token,
              user: { id: user.id, name: user.name, groups },
            }));
```

- [ ] **Step 4: Fix `Ctrl as any` (line 120)**

Old:
```typescript
              const routes = (Ctrl as any).routes;
```

New:
```typescript
              const routes = (Ctrl as unknown as { routes?: RouteDefinition[] }).routes;
```

Also add `RouteDefinition` to the dynamic import on line 15:

Old:
```typescript
          const { scanModules, installModules, runModuleSeeds, getModuleRegistry } =
            await server.ssrLoadModule('@erp/core');
```

New:
```typescript
          const { scanModules, installModules, runModuleSeeds, getModuleRegistry } =
            await server.ssrLoadModule('@erp/core');
          // Type-only: RouteDefinition from module-registry
          type RouteDefinition = { path: string; method: string; handler: string; auth?: boolean };
```

Wait — the `type` import needs to be at the top level. Let me just use an inline type instead of importing RouteDefinition.

New for line 120:
```typescript
              const routes = (Ctrl as unknown as {
                routes?: Array<{ path: string; method: string; handler: string }>;
              }).routes;
```

- [ ] **Step 5: Verify**

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

Edit `D:\projects\agent-erp\packages\admin\src\components\LoginPage.tsx`:

Old line 20:
```typescript
    } catch (e: any) {
```

New:
```typescript
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Login failed';
      setError(message);
```

Old lines 20-23:
```typescript
    } catch (e: any) {
      setError(e.message ?? 'Login failed');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
```

New:
```typescript
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
```

- [ ] **Step 2: Fix store.ts — remove unused `ViewSpec` import**

Edit `D:\projects\agent-erp\packages\admin\src\store.ts`:

Old line 2:
```typescript
import type { MenuItem, ViewSpec, AppState, BreadcrumbItem } from './types';
```

New:
```typescript
import type { MenuItem, AppState, BreadcrumbItem } from './types';
```

- [ ] **Step 3: Verify**

```bash
cd D:/projects/agent-erp && npx eslint packages/admin/src/components/LoginPage.tsx packages/admin/src/store.ts 2>&1
```

Expected: Zero errors.

- [ ] **Step 4: Commit**

```bash
cd D:/projects/agent-erp && git add packages/admin/src/components/LoginPage.tsx packages/admin/src/store.ts && git commit -m "fix: remove any in LoginPage and unused import in store"
```

---

### Task 11: Fix remaining test and decorator files (unused vars)

**Files:**
- Modify: `packages/admin/e2e/dashboard.spec.ts`
- Modify: `packages/admin/e2e/login.spec.ts`
- Modify: `packages/data/src/__tests__/migration-runner.test.ts`
- Modify: `packages/domain/src/__tests__/api.test.ts`
- Modify: `packages/domain/src/__tests__/registry.test.ts`

- [ ] **Step 1: Fix dashboard.spec.ts — prefix unused `page` params with `_`**

Edit `D:\projects\agent-erp\packages\admin\e2e\dashboard.spec.ts`:

Old lines 1, 4, 8, 12:
```typescript
import { test, expect } from '@playwright/test';
...
  test('shows greeting after login', async ({ page }) => {
...
  test('renders stat cards', async ({ page }) => {
...
  test('renders quick action pills', async ({ page }) => {
```

New:
```typescript
import { test } from '@playwright/test';
...
  test('shows greeting after login', async ({ page: _page }) => {
...
  test('renders stat cards', async ({ page: _page }) => {
...
  test('renders quick action pills', async ({ page: _page }) => {
```

- [ ] **Step 2: Fix login.spec.ts — prefix unused `page` param**

Edit `D:\projects\agent-erp\packages\admin\e2e\login.spec.ts`:

Old line 30:
```typescript
  test('logs out and returns to login', async ({ page }) => {
```

New:
```typescript
  test('logs out and returns to login', async ({ page: _page }) => {
```

- [ ] **Step 3: Fix migration-runner.test.ts — remove unused `MockFn` type**

Edit `D:\projects\agent-erp\packages\data\src\__tests__\migration-runner.test.ts`:

Remove line 4:
```typescript
type MockFn = ReturnType<typeof vi.fn>;
```

- [ ] **Step 4: Fix api.test.ts — prefix unused `_record` param with `_`**

Edit `D:\projects\agent-erp\packages\domain\src\__tests__\api.test.ts`:

Old line 9:
```typescript
      total(_record: Record<string, unknown>) {
```

New:
```typescript
      total(_record: Record<string, unknown>) {
```

No change needed — `_record` is already prefixed with `_` and `argsIgnorePattern: "^_"` handles it.

- [ ] **Step 5: Fix registry.test.ts — remove unused `getModelRegistry` import**

Edit `D:\projects\agent-erp\packages\domain\src\__tests__\registry.test.ts`:

Old line 2:
```typescript
import { ModelRegistry, getModelRegistry } from '../registry';
```

New:
```typescript
import { ModelRegistry } from '../registry';
```

- [ ] **Step 6: Verify all files pass lint**

```bash
cd D:/projects/agent-erp && npx eslint packages/admin/e2e/dashboard.spec.ts packages/admin/e2e/login.spec.ts packages/data/src/__tests__/migration-runner.test.ts packages/domain/src/__tests__/api.test.ts packages/domain/src/__tests__/registry.test.ts 2>&1
```

Expected: Zero errors.

- [ ] **Step 7: Commit**

```bash
cd D:/projects/agent-erp && git add packages/admin/e2e/dashboard.spec.ts packages/admin/e2e/login.spec.ts packages/data/src/__tests__/migration-runner.test.ts packages/domain/src/__tests__/api.test.ts packages/domain/src/__tests__/registry.test.ts && git commit -m "fix: remove unused vars in test files"
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

- [ ] **Step 3: Run type-check to verify no type regressions**

```bash
cd D:/projects/agent-erp && pnpm --filter @erp/core exec tsc --noEmit && pnpm --filter @erp/domain exec tsc --noEmit && pnpm --filter @erp/data exec tsc --noEmit 2>&1
```

Expected: No type errors.

- [ ] **Step 4: Final commit if any remaining fixes were needed during verification**

```bash
cd D:/projects/agent-erp && git add -u && git diff --cached --quiet || git commit -m "chore: final lint pass — zero errors"
```
