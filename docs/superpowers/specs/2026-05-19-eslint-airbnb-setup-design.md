# ESLint Airbnb Setup Design

## Goal

Install Airbnb ESLint rules, fix all existing lint errors, and enforce linting in CI/pre-commit.

## Architecture

Per-package ESLint config — backend packages (data, domain, core) use airbnb-base, frontend (admin) uses airbnb with React rules.

### Dependency Tree

```
Root (all packages share via hoisting):
  eslint-config-airbnb-base         # Airbnb JS base rules
  eslint-config-airbnb-typescript   # Airbnb → TypeScript adapter
  eslint-config-prettier            # Disable rules conflicting with Prettier
  eslint-import-resolver-typescript # TS path resolution for import plugin

Admin only (packages/admin/package.json):
  eslint-config-airbnb              # Airbnb React rules
  eslint-plugin-react               # peer dep
  eslint-plugin-react-hooks         # peer dep
  eslint-plugin-jsx-a11y            # peer dep
```

### Config Files

```
.eslintrc.json                    # Root: airbnb-base + airbnb-typescript/base + prettier
packages/admin/.eslintrc.json     # Admin: airbnb + airbnb-typescript + prettier
.lintstagedrc.json                # Pre-commit: only lint staged .ts/.tsx files
.husky/pre-commit                 # npx lint-staged
```

- Root config applies to data, domain, core, modules/base
- Admin config extends root defaults and adds React rules
- `eslint-config-prettier` always last in extends to override style rules

### Rule Overrides (root .eslintrc.json)

| Rule | Value | Reason |
|------|-------|--------|
| `no-console` | off | Backend scripts need console |
| `no-param-reassign` | off | Odoo-style env proxy writes |
| `import/prefer-default-export` | off | Project uses named exports |
| `import/no-extraneous-dependencies` | off | Monorepo cross-package refs |
| `class-methods-use-this` | off | ORM model method style |
| `max-classes-per-file` | off | Model files may have multiple classes |
| `@typescript-eslint/no-explicit-any` | error | Current project convention |
| `@typescript-eslint/no-unused-vars` | error + argsIgnorePattern: "^_" | Allow `_descriptor` params |

### Pre-commit & CI

- **lint-staged**: Runs `eslint --fix` on staged `.ts,.tsx` files only
- **husky**: pre-commit hook triggers lint-staged
- **CI**: `pnpm lint` runs full project check

## Fix Strategy for 42 Existing Errors

### Auto-fixable

- `no-unused-vars` where variable can be safely removed or prefixed with `_`
- Prettier-related formatting (sorted imports, spacing)

### Manual (no-explicit-any, 18 instances)

Replace `any` with proper types across these files:

| File | Count |
|------|-------|
| modules/base/controllers/user_controller.ts | 7 |
| packages/admin/e2e/admin.spec.ts | 6 |
| packages/admin/vite.config.ts | 5 |
| packages/core/src/module-scanner.ts | 4 |
| packages/core/src/module-registry.ts | 1 |
| packages/admin/src/components/LoginPage.tsx | 1 |

## Implementation Steps

1. Install dependencies (root + admin package.json)
2. Write config files (.eslintrc.json x2, .lintstagedrc.json, husky pre-commit)
3. Run `pnpm lint --fix` for auto-fixable errors
4. Manually fix remaining `no-explicit-any` and any unfixable errors
5. Verify `pnpm lint` passes with zero errors
