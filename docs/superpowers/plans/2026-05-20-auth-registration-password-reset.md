# Auth: User Registration & Password Reset — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add self-service user registration (with email verification) and forgot-password flow, and refactor auth endpoints from vite.config.ts into a proper controller.

**Architecture:** Backend adds a `verification.ts` utility using the crypto module for 6-digit codes stored in a new `erp_verification_codes` table, plus an `auth_controller.ts` following the existing controller pattern with `auth: false` routes. Frontend adds auth view state (`authView` in Zustand) to switch between Login/Register/ForgotPassword pages without a router, reusing the LoginPage visual design system.

**Tech Stack:** TypeScript, Knex (PostgreSQL), Node crypto, Zustand, React + Ant Design + framer-motion

---

### Task 1: Verification Code Utilities

**Files:**
- Create: `packages/core/src/auth/verification.ts`
- Create: `packages/core/src/__tests__/verification.test.ts`
- Modify: `packages/core/src/auth/index.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/__tests__/verification.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateCode } from '../auth/verification';

describe('generateCode', () => {
  it('returns a 6-digit string', () => {
    const code = generateCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('produces values in range 100000-999999', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateCode();
      const num = parseInt(code, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @erp/core exec vitest run src/__tests__/verification.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/auth/verification.ts
import crypto from 'node:crypto';

export function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @erp/core exec vitest run src/__tests__/verification.test.ts
```
Expected: PASS

- [ ] **Step 5: Add storeCode and verifyCode tests**

```ts
// Add to verification.test.ts
import { generateCode, storeCode, verifyCode, cleanupExpiredCodes } from '../auth/verification';
import type { Knex } from 'knex';

// Mock knex
function mockKnex(): Knex {
  const rows: Record<string, unknown>[] = [];
  const db = {
    table: vi.fn().mockReturnThis(),
    insert: vi.fn().mockImplementation((data) => {
      const row = { ...data, id: rows.length + 1, created_at: new Date() };
      rows.push(row);
      return { returning: vi.fn().mockResolvedValue([row]) };
    }),
    where: vi.fn().mockReturnThis(),
    whereRaw: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(1),
    andWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
  } as unknown as Knex;
  // Store rows for lookup by test
  (db as Record<string, unknown>)._rows = rows;
  return db;
}

describe('storeCode', () => {
  it('inserts a code and returns it', async () => {
    const db = mockKnex();
    const generated = generateCode();
    // Override generateCode for deterministic test
    const code = await storeCode(db, 1, 'register');
    expect(code).toMatch(/^\d{6}$/);
    expect(db.insert).toHaveBeenCalled();
  });
});

describe('verifyCode', () => {
  it('returns true for valid code', async () => {
    const db = mockKnex();
    const code = '123456';
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    (db.first as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      user_id: 1,
      code,
      type: 'register',
      expires_at: expiresAt,
      used: false,
    });

    const result = await verifyCode(db, 1, code, 'register');
    expect(result).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });

  it('returns false for expired code', async () => {
    const db = mockKnex();
    const expiresAt = new Date(Date.now() - 1000); // in the past
    (db.first as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      user_id: 1,
      code: '123456',
      type: 'register',
      expires_at: expiresAt,
      used: false,
    });

    const result = await verifyCode(db, 1, '123456', 'register');
    expect(result).toBe(false);
  });

  it('returns false for already-used code', async () => {
    const db = mockKnex();
    (db.first as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      user_id: 1,
      code: '123456',
      type: 'register',
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      used: true,
    });

    const result = await verifyCode(db, 1, '123456', 'register');
    expect(result).toBe(false);
  });

  it('returns false for wrong code', async () => {
    const db = mockKnex();
    (db.first as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await verifyCode(db, 1, '000000', 'register');
    expect(result).toBe(false);
  });
});

describe('cleanupExpiredCodes', () => {
  it('deletes expired codes', async () => {
    const db = mockKnex();
    await cleanupExpiredCodes(db);
    expect(db.where).toHaveBeenCalled();
    expect(db.delete).toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Run tests to verify they fail**

```bash
pnpm --filter @erp/core exec vitest run src/__tests__/verification.test.ts
```
Expected: FAIL — `storeCode`, `verifyCode`, `cleanupExpiredCodes` not exported

- [ ] **Step 7: Implement storeCode and verifyCode**

```ts
// packages/core/src/auth/verification.ts (full file)
import crypto from 'node:crypto';
import type { Knex } from 'knex';

const CODE_EXPIRY_MINUTES = 10;

export function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function storeCode(
  db: Knex,
  userId: number,
  type: 'register' | 'reset',
): Promise<string> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  await db('erp_verification_codes').insert({
    user_id: userId,
    code,
    type,
    expires_at: expiresAt,
  });

  return code;
}

export async function verifyCode(
  db: Knex,
  userId: number,
  code: string,
  type: 'register' | 'reset',
): Promise<boolean> {
  // Also clean up expired codes on each verify attempt
  await cleanupExpiredCodes(db);

  const record = await db('erp_verification_codes')
    .where({ user_id: userId, code, type, used: false })
    .whereRaw("expires_at > NOW()")
    .orderBy('id', 'desc')
    .first();

  if (!record) return false;

  await db('erp_verification_codes')
    .where({ id: record.id })
    .update({ used: true });

  return true;
}

export async function cleanupExpiredCodes(db: Knex): Promise<void> {
  await db('erp_verification_codes')
    .whereRaw("expires_at <= NOW()")
    .delete();
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
pnpm --filter @erp/core exec vitest run src/__tests__/verification.test.ts
```
Expected: PASS

- [ ] **Step 9: Export from auth index**

```ts
// packages/core/src/auth/index.ts — add to existing exports:
export { generateCode, storeCode, verifyCode, cleanupExpiredCodes } from './verification';
```

- [ ] **Step 10: Commit**

```bash
git add packages/core/src/auth/verification.ts packages/core/src/__tests__/verification.test.ts packages/core/src/auth/index.ts
git commit -m "feat: add verification code utilities with tests"
```

---

### Task 2: Auth Controller

**Files:**
- Create: `modules/base/controllers/auth_controller.ts`
- Create: `modules/base/controllers/__tests__/auth_controller.test.ts`

- [ ] **Step 1: Write the auth controller**

```ts
// modules/base/controllers/auth_controller.ts
import { env } from '@erp/domain';
import { hashPassword, verifyPassword, signToken } from '@erp/core';
import { getKnex } from '@erp/data';
import { storeCode, verifyCode } from '@erp/core';

export class AuthController {
  static routes = [
    { path: '/api/auth/login', method: 'POST' as const, handler: 'login', auth: false },
    { path: '/api/auth/register', method: 'POST' as const, handler: 'register', auth: false },
    { path: '/api/auth/verify-registration', method: 'POST' as const, handler: 'verifyRegistration', auth: false },
    { path: '/api/auth/forgot-password', method: 'POST' as const, handler: 'forgotPassword', auth: false },
    { path: '/api/auth/reset-password', method: 'POST' as const, handler: 'resetPassword', auth: false },
  ];

  async login(ctx: { body: Record<string, unknown> }) {
    const { login, password } = ctx.body;

    if (!login || !password) {
      throw new Error('Login and password are required');
    }

    const knex = getKnex();
    const user = await knex('res_users')
      .where({ login: login as string, active: true })
      .first();

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const valid = await verifyPassword(password as string, user.password);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const groupRows = await knex('res_users_groups_rel')
      .where({ user_id: user.id })
      .select('group_id');

    const groups = groupRows.map((r: { group_id: unknown }) => String(r.group_id));
    const token = signToken({ userId: user.id, groups });

    return {
      token,
      user: { id: user.id, name: user.name, groups },
    };
  }

  async register(ctx: { body: Record<string, unknown> }) {
    const { name, login, password, email } = ctx.body;

    if (!name || !login || !password || !email) {
      throw new Error('Name, login, password, and email are required');
    }

    if (typeof password === 'string' && password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const knex = getKnex();

    // Check for existing login
    const existingLogin = await knex('res_users')
      .where({ login: login as string })
      .first();
    if (existingLogin) {
      throw new Error('A user with this login already exists');
    }

    // Check for existing email
    const existingEmail = await knex('res_users')
      .where({ email: email as string })
      .first();
    if (existingEmail) {
      throw new Error('A user with this email already exists');
    }

    const hashed = await hashPassword(password as string);
    const created = await env('res.users').create({
      name: name as string,
      login: login as string,
      password: hashed,
      email: email as string,
      active: false,
    });

    const code = await storeCode(knex, (created as Record<string, unknown>).id as number, 'register');

    // Dev mode: log code to console
    console.log(`[DEV] Verification code for ${login}: ${code}`);

    return {
      userId: (created as Record<string, unknown>).id,
      message: 'Registration successful. Please verify your email.',
    };
  }

  async verifyRegistration(ctx: { body: Record<string, unknown> }) {
    const { userId, code } = ctx.body;

    if (!userId || !code) {
      throw new Error('User ID and code are required');
    }

    const knex = getKnex();
    const valid = await verifyCode(knex, userId as number, code as string, 'register');

    if (!valid) {
      throw new Error('Invalid or expired verification code');
    }

    await env('res.users').write([userId as number], { active: true });

    return { message: 'Account activated. You can now log in.' };
  }

  async forgotPassword(ctx: { body: Record<string, unknown> }) {
    const { email } = ctx.body;

    if (!email) {
      throw new Error('Email is required');
    }

    const knex = getKnex();
    const user = await knex('res_users')
      .where({ email: email as string })
      .first();

    // Always return success to avoid user enumeration
    if (!user) {
      return { message: 'If the email exists, a reset code has been sent.' };
    }

    const code = await storeCode(knex, user.id, 'reset');

    // Dev mode: log userId and code to console
    console.log(`[DEV] Password reset for user ID ${user.id} (${user.login}): code ${code}`);

    return { message: 'If the email exists, a reset code has been sent.' };
  }

  async resetPassword(ctx: { body: Record<string, unknown> }) {
    const { userId, code, password } = ctx.body;

    if (!userId || !code || !password) {
      throw new Error('User ID, code, and new password are required');
    }

    if (typeof password === 'string' && password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const knex = getKnex();
    const valid = await verifyCode(knex, userId as number, code as string, 'reset');

    if (!valid) {
      throw new Error('Invalid or expired reset code');
    }

    const hashed = await hashPassword(password as string);
    await env('res.users').write([userId as number], { password: hashed });

    return { message: 'Password has been reset. You can now log in.' };
  }
}
```

- [ ] **Step 2: Verify the controller compiles**

```bash
pnpm --filter @erp/core exec tsc --noEmit
```
Expected: no errors related to auth_controller

- [ ] **Step 3: Commit**

```bash
git add modules/base/controllers/auth_controller.ts
git commit -m "feat: add auth controller with login, register, forgot/reset password"
```

---

### Task 3: Register Auth Controller in Base Module

**Files:**
- Modify: `modules/base/index.ts`

- [ ] **Step 1: Add AuthController to controllers array**

Edit `modules/base/index.ts` — add the import and add to the controllers array:

```ts
import { AuthController } from './controllers/auth_controller';

export const controllers = [PartnerController, UserController, GroupController, AuthController];
```

- [ ] **Step 2: Commit**

```bash
git add modules/base/index.ts
git commit -m "feat: register auth controller in base module"
```

---

### Task 4: Remove Inline Login from Vite Config

**Files:**
- Modify: `packages/admin/vite.config.ts`

- [ ] **Step 1: Remove the inline login middleware**

In `packages/admin/vite.config.ts`, remove lines 103-149 (the entire `// --- Auth middleware ---` block, from `server.middlewares.use(async (req...` through the closing `});` that ends the auth middleware). The generic controller route matcher below it will automatically handle `/api/auth/login` via the AuthController.

- [ ] **Step 2: Verify the generic middleware handles auth routes**

The generic controller route matcher (lines 151-219) already iterates all installed modules' controllers and matches routes. Since `AuthController` now has `auth: false` on all its routes, the middleware will skip the JWT requirement and call the handler directly.

- [ ] **Step 3: Commit**

```bash
git add packages/admin/vite.config.ts
git commit -m "refactor: remove inline login, delegate to auth controller"
```

---

### Task 5: Migration for Verification Codes Table

**Files:**
- Create: migration SQL (run via the existing migration system or manually)
- Note: The `diffAndMigrate` system auto-creates tables from model definitions. Since verification codes are infrastructure, not a business model, we'll create the table manually via a seed migration.

- [ ] **Step 1: Add table creation to the base module seed**

```ts
// modules/base/data/seed.ts — add at the top of the seed function:
export default async function seed(knex: Knex): Promise<void> {
  // Create verification codes table if not exists
  const hasTable = await knex.schema.hasTable('erp_verification_codes');
  if (!hasTable) {
    await knex.schema.createTable('erp_verification_codes', (t) => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('res_users').onDelete('CASCADE');
      t.string('code', 6).notNullable();
      t.string('type', 20).notNullable();
      t.timestamp('expires_at', { useTz: true }).notNullable();
      t.boolean('used').defaultTo(false);
      t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    });
  }

  // ... rest of existing seed
}
```

- [ ] **Step 2: Commit**

```bash
git add modules/base/data/seed.ts
git commit -m "feat: add erp_verification_codes table to seed migration"
```

---

### Task 6: Update Store Types and Actions

**Files:**
- Modify: `packages/admin/src/types.ts`
- Modify: `packages/admin/src/store.ts`

- [ ] **Step 1: Add authView type to AppState**

In `packages/admin/src/types.ts`, add the auth view type and new state/actions to `AppState`:

```ts
export type AuthView = 'login' | 'register' | 'verify-registration' | 'forgot-password' | 'reset-password';

// Add to AppState interface:
export interface AppState {
  // ... existing fields ...
  authView: AuthView;

  // ... existing methods ...

  setAuthView: (view: AuthView) => void;
  register: (data: { name: string; login: string; password: string; email: string }) => Promise<{ userId: number; message: string }>;
  verifyRegistration: (userId: number, code: string) => Promise<{ message: string }>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (userId: number, code: string, password: string) => Promise<{ message: string }>;
}
```

- [ ] **Step 2: Implement the new store actions**

In `packages/admin/src/store.ts`:
- Import `AuthView` from `./types`
- Add `authView: 'login'` to the initial state
- Add `setAuthView` setter
- Add `register`, `verifyRegistration`, `forgotPassword`, `resetPassword` async actions following the same fetch pattern as `login`

```ts
import type { AuthView } from './types';

// In create<AppState>:
authView: 'login',

setAuthView: (view) => set({ authView: view }),

register: async (data) => {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Registration failed');
  return json;
},

verifyRegistration: async (userId, code) => {
  const res = await fetch('/api/auth/verify-registration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, code }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Verification failed');
  return json;
},

forgotPassword: async (email) => {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json;
},

resetPassword: async (userId, code, password) => {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, code, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Reset failed');
  return json;
},
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm --filter @erp/admin exec tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add packages/admin/src/types.ts packages/admin/src/store.ts
git commit -m "feat: add authView state and auth actions to store"
```

---

### Task 7: Update LoginPage with Links

**Files:**
- Modify: `packages/admin/src/components/LoginPage.tsx`

- [ ] **Step 1: Add "Create account" and "Forgot password?" links**

In `LoginPage.tsx`, import `useStore` and add `setAuthView`:

```tsx
const setAuthView = useStore((s) => s.setAuthView);
```

Below the submit button (after `</Form.Item>` closing the button, before `</Form>`), add:

```tsx
<div className="erp-login-links">
  <button
    type="button"
    className="erp-login-link"
    onClick={() => setAuthView('register')}
  >
    Create account
  </button>
  <button
    type="button"
    className="erp-login-link erp-login-link-muted"
    onClick={() => setAuthView('forgot-password')}
  >
    Forgot password?
  </button>
</div>
```

- [ ] **Step 2: Add CSS for the links**

In `packages/admin/src/index.css`, add after the existing `.erp-login-btn:hover` block:

```css
.erp-login-links {
  display: flex;
  justify-content: space-between;
  margin-top: 14px;
}

.erp-login-link {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #1890ff;
  padding: 0;
  font-family: inherit;
}

.erp-login-link:hover {
  color: #40a9ff;
}

.erp-login-link-muted {
  color: #8c8c8c;
}

.erp-login-link-muted:hover {
  color: #595959;
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/components/LoginPage.tsx packages/admin/src/index.css
git commit -m "feat: add register and forgot password links to login page"
```

---

### Task 8: CodeInput Component

**Files:**
- Create: `packages/admin/src/components/CodeInput.tsx`

- [ ] **Step 1: Create the component**

```tsx
// packages/admin/src/components/CodeInput.tsx
import React, { useRef, useState, useEffect } from 'react';

interface CodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
}

const CodeInput: React.FC<CodeInputProps> = ({ length = 6, onComplete, disabled }) => {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return;

    const newValues = [...values];
    newValues[index] = char.slice(-1);
    setValues(newValues);

    // Auto-advance
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check complete
    const code = newValues.join('');
    if (code.length === length) {
      onComplete(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;

    const newValues = Array(length).fill('');
    for (let i = 0; i < pasted.length; i++) {
      newValues[i] = pasted[i]!;
    }
    setValues(newValues);

    const focusIdx = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIdx]?.focus();

    if (pasted.length === length) {
      onComplete(pasted);
    }
  };

  return (
    <div className="erp-code-input" onPaste={handlePaste}>
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          className="erp-code-input-box"
          autoComplete="off"
        />
      ))}
    </div>
  );
};

export default CodeInput;
```

- [ ] **Step 2: Add CSS**

```css
/* In packages/admin/src/index.css */
.erp-code-input {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.erp-code-input-box {
  width: 40px;
  height: 48px;
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: #fff;
  outline: none;
  transition: border-color 0.2s;
  font-family: var(--font-body);
}

.erp-code-input-box:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.15);
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/components/CodeInput.tsx packages/admin/src/index.css
git commit -m "feat: add CodeInput component for 6-digit verification"
```

---

### Task 9: RegisterPage Component

**Files:**
- Create: `packages/admin/src/components/RegisterPage.tsx`

- [ ] **Step 1: Create RegisterPage**

```tsx
// packages/admin/src/components/RegisterPage.tsx
import React, { useState } from 'react';
import { Input, Button, Form } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import CodeInput from './CodeInput';

const RegisterPage: React.FC = () => {
  const register = useStore((s) => s.register);
  const verifyRegistration = useStore((s) => s.verifyRegistration);
  const setAuthView = useStore((s) => s.setAuthView);

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleRegister = async (values: {
    name: string;
    email: string;
    login: string;
    password: string;
  }) => {
    setError('');
    setLoading(true);
    try {
      const result = await register(values);
      setUserId(result.userId);
      setStep('verify');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (code: string) => {
    if (!userId) return;
    setError('');
    setLoading(true);
    try {
      await verifyRegistration(userId, code);
      setAuthView('login');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="erp-login-page">
      <div className="erp-login-blob erp-login-blob-1" />
      <div className="erp-login-blob erp-login-blob-2" />
      <div className="erp-login-blob erp-login-blob-3" />

      <div className="erp-login-brand">
        <div className="erp-login-brand-icon">A</div>
        <div>
          <div className="erp-login-brand-name">Agent ERP</div>
          <div className="erp-login-brand-sub">智能企业管理平台</div>
        </div>
      </div>

      <motion.div
        className="erp-login-card"
        initial={{ opacity: 0, y: 24 }}
        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : { opacity: 1, y: 0 }}
        transition={shake
          ? { duration: 0.4 }
          : { duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {step === 'form' ? (
          <>
            <h2 className="erp-login-title">Create Account</h2>
            <p className="erp-login-subtitle">Fill in your details to register</p>

            <Form onFinish={handleRegister} layout="vertical" size="large">
              <Form.Item
                name="name"
                rules={[{ required: true, message: 'Please enter your name' }]}
              >
                <Input
                  prefix={<IdcardOutlined className="text-[#bfbfbf]" />}
                  placeholder="Name"
                  className="erp-login-input"
                />
              </Form.Item>

              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-[#bfbfbf]" />}
                  placeholder="Email"
                  autoComplete="email"
                  className="erp-login-input"
                />
              </Form.Item>

              <Form.Item
                name="login"
                rules={[{ required: true, message: 'Please enter a username' }]}
              >
                <Input
                  prefix={<UserOutlined className="text-[#bfbfbf]" />}
                  placeholder="Username"
                  autoComplete="username"
                  className="erp-login-input"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: 'Please enter a password' },
                  { min: 6, message: 'Password must be at least 6 characters' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-[#bfbfbf]" />}
                  placeholder="Password"
                  autoComplete="new-password"
                  className="erp-login-input"
                />
              </Form.Item>

              <Form.Item
                name="confirm"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-[#bfbfbf]" />}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className="erp-login-input"
                />
              </Form.Item>

              {error && (
                <div className="erp-login-error">{error}</div>
              )}

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="erp-login-btn"
                  block
                >
                  Send Verification Code
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button
                type="button"
                className="erp-login-link"
                onClick={() => setAuthView('login')}
              >
                &larr; Back to login
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="erp-login-title">Verify Email</h2>
            <p className="erp-login-subtitle">
              A 6-digit code was sent to your email (check server console)
            </p>

            <div style={{ margin: '20px 0' }}>
              <CodeInput onComplete={handleVerify} disabled={loading} />
            </div>

            {error && (
              <div className="erp-login-error">{error}</div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', color: '#8c8c8c', marginTop: 12 }}>
                Verifying...
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button
                type="button"
                className="erp-login-link"
                onClick={() => { setStep('form'); setError(''); }}
              >
                &larr; Back
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default RegisterPage;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm --filter @erp/admin exec tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/components/RegisterPage.tsx
git commit -m "feat: add RegisterPage component"
```

---

### Task 10: ForgotPasswordPage Component

**Files:**
- Create: `packages/admin/src/components/ForgotPasswordPage.tsx`

- [ ] **Step 1: Create ForgotPasswordPage (final version)**

```tsx
// packages/admin/src/components/ForgotPasswordPage.tsx
import React, { useState } from 'react';
import { Input, Button, Form } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined, SafetyOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import CodeInput from './CodeInput';

const ForgotPasswordPage: React.FC = () => {
  const forgotPassword = useStore((s) => s.forgotPassword);
  const resetPassword = useStore((s) => s.resetPassword);
  const setAuthView = useStore((s) => s.setAuthView);

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState('');
  const [userIdInput, setUserIdInput] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleEmailSubmit = async (values: { email: string }) => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const result = await forgotPassword(values.email);
      setMessage(result.message);
      setStep('reset');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = parseInt(userIdInput, 10);
    if (!uid) {
      setError('Please enter the User ID from the server console');
      return;
    }
    if (!code || code.length < 6) {
      setError('Please enter the 6-digit reset code');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(uid, code, newPassword);
      setAuthView('login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset failed');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="erp-login-page">
      <div className="erp-login-blob erp-login-blob-1" />
      <div className="erp-login-blob erp-login-blob-2" />
      <div className="erp-login-blob erp-login-blob-3" />

      <div className="erp-login-brand">
        <div className="erp-login-brand-icon">A</div>
        <div>
          <div className="erp-login-brand-name">Agent ERP</div>
          <div className="erp-login-brand-sub">智能企业管理平台</div>
        </div>
      </div>

      <motion.div
        className="erp-login-card"
        initial={{ opacity: 0, y: 24 }}
        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : { opacity: 1, y: 0 }}
        transition={shake
          ? { duration: 0.4 }
          : { duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {step === 'email' ? (
          <>
            <h2 className="erp-login-title">Reset Password</h2>
            <p className="erp-login-subtitle">Enter your email to receive a reset code</p>

            <Form onFinish={handleEmailSubmit} layout="vertical" size="large">
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-[#bfbfbf]" />}
                  placeholder="Email"
                  autoComplete="email"
                  className="erp-login-input"
                />
              </Form.Item>

              {error && <div className="erp-login-error">{error}</div>}
              {message && (
                <div style={{ color: '#52c41a', fontSize: 13, marginBottom: 12 }}>{message}</div>
              )}

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="erp-login-btn"
                  block
                >
                  Send Reset Code
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button
                type="button"
                className="erp-login-link"
                onClick={() => setAuthView('login')}
              >
                &larr; Back to login
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="erp-login-title">Set New Password</h2>
            <p className="erp-login-subtitle">
              Check the server console for the User ID and reset code
            </p>

            <form onSubmit={handleReset}>
              <div style={{ marginBottom: 16 }}>
                <Input
                  prefix={<UserOutlined className="text-[#bfbfbf]" />}
                  placeholder="User ID (from server console)"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  className="erp-login-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <SafetyOutlined className="text-[#bfbfbf]" />
                  <span style={{ fontSize: 13, color: '#8c8c8c' }}>Reset Code</span>
                </div>
                <CodeInput onComplete={(c) => setCode(c)} disabled={loading} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <Input.Password
                  prefix={<LockOutlined className="text-[#bfbfbf]" />}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="erp-login-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <Input.Password
                  prefix={<LockOutlined className="text-[#bfbfbf]" />}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="erp-login-input"
                  style={{ width: '100%' }}
                />
              </div>

              {error && <div className="erp-login-error">{error}</div>}

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="erp-login-btn"
                block
              >
                Reset Password
              </Button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button
                type="button"
                className="erp-login-link"
                onClick={() => { setStep('email'); setError(''); }}
              >
                &larr; Back
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
```

- [ ] **Step 2: Commit**

```bash
git add packages/admin/src/components/ForgotPasswordPage.tsx
git commit -m "feat: add ForgotPasswordPage component"
```

---

### Task 11: Update App.tsx for Auth View Routing

**Files:**
- Modify: `packages/admin/src/App.tsx`

- [ ] **Step 1: Add auth view routing**

In `App.tsx`, replace the single `if (!user) return <LoginPage />;` with auth view switching:

```tsx
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';

// Replace:
//   if (!user) return <LoginPage />;
// With:
const authView = useStore((s) => s.authView);

if (!user) {
  switch (authView) {
    case 'register':
      return <RegisterPage />;
    case 'verify-registration':
      // verify-registration is handled inside RegisterPage as a sub-step
      return <RegisterPage />;
    case 'forgot-password':
    case 'reset-password':
      return <ForgotPasswordPage />;
    default:
      return <LoginPage />;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/admin/src/App.tsx
git commit -m "feat: add auth view routing to App"
```

---

### Task 12: E2E Tests

**Files:**
- Create: `packages/admin/e2e/auth-flows.spec.ts`

- [ ] **Step 1: Write the e2e tests**

```ts
// packages/admin/e2e/auth-flows.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Auth Flows', () => {
  test.describe('Registration', () => {
    test('shows registration page from login', async ({ page }) => {
      await page.goto('/');
      await page.locator('text=Create account').click();
      await expect(page.locator('text=Create Account')).toBeVisible();
      await expect(page.locator('input[placeholder="Name"]')).toBeVisible();
      await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
      await expect(page.locator('input[placeholder="Username"]')).toBeVisible();
    });

    test('shows validation errors for empty form', async ({ page }) => {
      await page.goto('/');
      await page.locator('text=Create account').click();
      await page.locator('.erp-login-btn').click();
      await expect(page.getByText('Please enter your name')).toBeVisible();
      await expect(page.getByText('Please enter your email')).toBeVisible();
      await expect(page.getByText('Please enter a username')).toBeVisible();
    });

    test('can navigate back to login', async ({ page }) => {
      await page.goto('/');
      await page.locator('text=Create account').click();
      await page.locator('text=Back to login').click();
      await expect(page.locator('.erp-login-title')).toHaveText('欢迎登录');
    });
  });

  test.describe('Forgot Password', () => {
    test('shows forgot password page from login', async ({ page }) => {
      await page.goto('/');
      await page.locator('text=Forgot password?').click();
      await expect(page.locator('text=Reset Password')).toBeVisible();
      await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
    });

    test('shows validation for empty email', async ({ page }) => {
      await page.goto('/');
      await page.locator('text=Forgot password?').click();
      await page.locator('.erp-login-btn').click();
      await expect(page.getByText('Please enter your email')).toBeVisible();
    });

    test('can navigate back to login', async ({ page }) => {
      await page.goto('/');
      await page.locator('text=Forgot password?').click();
      await page.locator('text=Back to login').click();
      await expect(page.locator('.erp-login-title')).toHaveText('欢迎登录');
    });
  });
});
```

- [ ] **Step 2: Run e2e tests**

```bash
npx playwright test --config=packages/admin/playwright.config.ts packages/admin/e2e/auth-flows.spec.ts
```
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/admin/e2e/auth-flows.spec.ts
git commit -m "test: add e2e tests for registration and forgot password flows"
```

---

### Task 13: Final Integration Verification

- [ ] **Step 1: Start the dev server and test manually**

```bash
pnpm --filter @erp/admin dev
```

Manual test checklist:
1. Open http://localhost:3000 — should see login page with "Create account" and "Forgot password?" links
2. Click "Create account" → fills form → submits → sees verification step
3. Check server console for verification code
4. Enter code → redirected to login
5. Login with new credentials → enters dashboard
6. Logout → click "Forgot password?" → enter email → check console for userId and code
7. Enter userId + code + new password → redirected to login
8. Login with new password → enters dashboard
9. Login with admin/admin — existing flow still works

- [ ] **Step 2: Run full test suite**

```bash
pnpm test
pnpm --filter @erp/core exec vitest run
pnpm --filter @erp/admin exec tsc --noEmit
```

Expected: all tests pass, no type errors

- [ ] **Step 3: Commit if any fixes were needed**

```bash
git add -A
git commit -m "chore: final integration fixes"
```
