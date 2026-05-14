# Login Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete JWT-based authentication with a visually polished sky-blue login page.

**Architecture:** Auth utilities (bcrypt + JWT) in `@erp/core`, Vite dev-server middleware for `/api/auth/login`, LoginPage component with framer-motion animations, Zustand store auth actions with localStorage token persistence, and login gate in App.tsx.

**Tech Stack:** React 18, Ant Design 5, Tailwind CSS 3, framer-motion, Zustand, bcrypt, jsonwebtoken, Vite middleware

---

### Task 1: Install dependencies

**Files:**
- Modify: `packages/core/package.json`

- [ ] **Step 1: Add bcrypt and jsonwebtoken to @erp/core**

```bash
cd packages/core && pnpm add bcrypt jsonwebtoken && pnpm add -D @types/bcrypt @types/jsonwebtoken
```

- [ ] **Step 2: Verify install**

```bash
node -e "require('bcrypt'); require('jsonwebtoken'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add packages/core/package.json pnpm-lock.yaml
git commit -m "chore: add bcrypt and jsonwebtoken deps to @erp/core"
```

---

### Task 2: Auth utilities in @erp/core

**Files:**
- Create: `packages/core/src/auth/password.ts`
- Create: `packages/core/src/auth/token.ts`
- Create: `packages/core/src/auth/index.ts`

- [ ] **Step 1: Create password.ts**

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 2: Create token.ts**

```typescript
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET ?? 'erp-dev-secret';
const EXPIRES_IN = '24h';

export interface TokenPayload {
  userId: number;
  groups: string[];
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload;
}
```

- [ ] **Step 3: Create auth/index.ts**

```typescript
export { hashPassword, verifyPassword } from './password';
export { signToken, verifyToken } from './token';
export type { TokenPayload } from './token';
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm --filter @erp/core exec tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Write unit tests for auth utilities**

Create `packages/core/src/__tests__/password.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../auth/password';

describe('hashPassword', () => {
  it('returns a string different from the input', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).not.toBe('secret123');
    expect(hash.startsWith('$2b$')).toBe(true);
  });

  it('produces different hashes for same input', async () => {
    const h1 = await hashPassword('secret123');
    const h2 = await hashPassword('secret123');
    expect(h1).not.toBe(h2);
  });
});

describe('verifyPassword', () => {
  it('returns true for correct password', async () => {
    const hash = await hashPassword('secret123');
    expect(await verifyPassword('secret123', hash)).toBe(true);
  });

  it('returns false for wrong password', async () => {
    const hash = await hashPassword('secret123');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});
```

Create `packages/core/src/__tests__/token.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from '../auth/token';

describe('signToken', () => {
  it('returns a string token', () => {
    const token = signToken({ userId: 1, groups: ['admin'] });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });
});

describe('verifyToken', () => {
  it('returns payload for a valid token', () => {
    const payload = { userId: 1, groups: ['admin'] };
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(1);
    expect(decoded.groups).toEqual(['admin']);
  });

  it('throws for invalid token', () => {
    expect(() => verifyToken('bad.token.here')).toThrow();
  });
});
```

- [ ] **Step 6: Run auth unit tests**

```bash
pnpm --filter @erp/core test
```

Expected: all 6 tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/auth/ packages/core/src/__tests__/
git commit -m "feat: add bcrypt password hashing and JWT token utilities with tests"
```

---

### Task 3: Update ResUsers model — remove AES encrypt from password

**Files:**
- Modify: `modules/base/models/res_users.ts`

- [ ] **Step 1: Remove encrypt from password field**

Change the password field from `@fields.char({ encrypt: true })` to `@fields.char({})`:

```typescript
import { Model, model, fields } from '@erp/domain';

@model({ _name: 'res.users', _description: 'User' })
export class ResUsers extends Model {
  @fields.char({ required: true })
  name!: string;

  @fields.char({ required: true })
  login!: string;

  @fields.char({})
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

- [ ] **Step 2: Commit**

```bash
git add modules/base/models/res_users.ts
git commit -m "fix: remove AES encrypt from res.users password field (now handled by bcrypt)"
```

---

### Task 4: Vite auth middleware

**Files:**
- Modify: `packages/admin/vite.config.ts`

- [ ] **Step 1: Add auth middleware plugin to vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

function authPlugin() {
  return {
    name: 'erp-auth-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.method === 'POST' && req.url === '/api/auth/login') {
          const body = await readBody(req);
          try {
            const { login, password } = JSON.parse(body);

            const { getKnex, initConnection } = await import('@erp/data');
            const { verifyPassword, signToken } = await import('@erp/core/auth');

            // Lazy-init DB connection if not already initialized
            let knex: any;
            try {
              knex = getKnex();
            } catch {
              knex = initConnection({
                host: process.env.DB_HOST ?? 'localhost',
                port: parseInt(process.env.DB_PORT ?? '5432'),
                database: process.env.DB_NAME ?? 'agent_erp',
                user: process.env.DB_USER ?? 'postgres',
                password: process.env.DB_PASSWORD ?? 'postgres',
              });
            }

            const user = await knex('res_users')
              .where({ login, active: true })
              .first();

            if (!user) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid credentials' }));
              return;
            }

            const valid = await verifyPassword(password, user.password);
            if (!valid) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid credentials' }));
              return;
            }

            const token = signToken({ userId: user.id, groups: [] });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              token,
              user: { id: user.id, name: user.name, groups: [] },
            }));
          } catch {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid credentials' }));
          }
        } else {
          next();
        }
      });
    },
  };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export default defineConfig({
  plugins: [authPlugin(), react()],
  server: {
    port: 3000,
  },
});
```

**Important:** `authPlugin()` must be BEFORE `react()` in the plugins array so it runs before the React/Vite pipeline.

- [ ] **Step 2: Verify dev server starts**

```bash
pnpm --filter @erp/admin dev
```

Expected: dev server starts on port 3000 without errors. Kill after verifying.

- [ ] **Step 3: Commit**

```bash
git add packages/admin/vite.config.ts
git commit -m "feat: add /api/auth/login Vite middleware with bcrypt + JWT"
```

---

### Task 5: Update types — add token to AppState

**Files:**
- Modify: `packages/admin/src/types.ts`

- [ ] **Step 1: Add token field and auth actions to AppState**

```typescript
export interface MenuItem {
  id: string;
  name: string;
  icon?: string;
  sequence: number;
  parentId?: string;
  action?: string;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
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
  token: string | null;
  siderCollapsed: boolean;
  breadcrumbs: BreadcrumbItem[];

  setMenuItems: (items: MenuItem[]) => void;
  setActiveMenu: (id: string) => void;
  setActiveView: (view: ViewSpec | null) => void;
  setUser: (user: AppState['user']) => void;
  setSiderCollapsed: (collapsed: boolean) => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;

  initializeAuth: () => void;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/admin/src/types.ts
git commit -m "feat: add token, login, logout, initializeAuth to AppState type"
```

---

### Task 6: Update store — add auth actions

**Files:**
- Modify: `packages/admin/src/store.ts`

- [ ] **Step 1: Add auth logic to store.ts**

Replace the entire file:

```typescript
import { create } from 'zustand';
import type { MenuItem, ViewSpec, AppState, BreadcrumbItem } from './types';

export type { MenuItem, ViewSpec, ViewField, ViewLayout, ViewLayoutItem, BreadcrumbItem } from './types';

export function computeBreadcrumbs(
  menuItems: MenuItem[],
  activeMenuId: string | null,
): BreadcrumbItem[] {
  if (!activeMenuId) return [];

  const breadcrumbs: BreadcrumbItem[] = [];
  let currentId: string | undefined = activeMenuId;

  while (currentId) {
    const item = menuItems.find((m) => m.id === currentId);
    if (!item) break;
    breadcrumbs.unshift({ id: item.id, name: item.name });
    currentId = item.parentId;
  }

  return breadcrumbs;
}

export const useStore = create<AppState>((set, get) => ({
  menuItems: [],
  activeMenuId: null,
  activeView: null,
  user: null,
  token: null,
  siderCollapsed: true,
  breadcrumbs: [],

  setMenuItems: (items) => {
    const { activeMenuId } = get();
    set({ menuItems: items, breadcrumbs: computeBreadcrumbs(items, activeMenuId) });
  },
  setActiveMenu: (id) => {
    const { menuItems } = get();
    set({ activeMenuId: id, breadcrumbs: computeBreadcrumbs(menuItems, id) });
  },
  setActiveView: (view) => set({ activeView: view }),
  setUser: (user) => set({ user }),
  setSiderCollapsed: (collapsed) => set({ siderCollapsed: collapsed }),
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

  initializeAuth: () => {
    const token = localStorage.getItem('token');
    if (token) {
      set({ token });
    }
  },

  login: async (login: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('token', data.token);
    set({ token: data.token, user: data.user });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, activeView: null });
  },
}));

declare global {
  interface Window { __STORE__?: typeof useStore; }
}
if (typeof window !== 'undefined') {
  window.__STORE__ = useStore;
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

Expected: no errors in store.ts

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/store.ts
git commit -m "feat: add login, logout, initializeAuth actions to admin store"
```

---

### Task 7: Update main.tsx — sky blue theme + auth init

**Files:**
- Modify: `packages/admin/src/main.tsx`

- [ ] **Step 1: Change theme to sky blue and add auth initialization**

Replace the entire file:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import App from './App';
import { useStore } from './store';
import './index.css';

// Initialize auth before first render
useStore.getState().initializeAuth();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#ff4d4f',
          colorInfo: '#1890ff',
          borderRadius: 8,
          borderRadiusLG: 14,
          borderRadiusSM: 6,
          colorBgContainer: '#ffffff',
          colorBgLayout: '#f5f7fa',
          colorBorderSecondary: '#e8ecf1',
          fontFamily:
            "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: 14,
          controlHeight: 36,
          lineHeight: 1.6,
          colorText: '#1a1f1c',
          colorTextSecondary: '#6b726e',
          colorFillAlter: '#f5f7fa',
          colorBgElevated: '#ffffff',
          boxShadow:
            '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
          boxShadowSecondary:
            '0 4px 16px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
        },
        components: {
          Layout: {
            siderBg: 'transparent',
            headerBg: 'transparent',
            bodyBg: '#f5f7fa',
          },
          Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(24,144,255,0.35)',
            darkItemHoverBg: 'rgba(255,255,255,0.04)',
            itemBorderRadius: 8,
            darkItemColor: 'rgba(255,255,255,0.65)',
            darkItemSelectedColor: '#ffffff',
            itemMarginBlock: 1,
            itemMarginInline: 8,
            subMenuItemBg: 'transparent',
          },
          Table: {
            headerBg: '#f5f7fa',
            borderColor: '#e8ecf1',
            headerBorderRadius: 8,
            cellPaddingBlock: 12,
            cellPaddingInline: 16,
          },
          Button: {
            borderRadius: 8,
            controlHeight: 36,
            paddingContentHorizontal: 20,
            primaryShadow: '0 2px 8px rgba(24,144,255,0.25)',
          },
          Input: {
            borderRadius: 8,
            controlHeight: 36,
            activeBorderColor: '#1890ff',
            hoverBorderColor: '#40a9ff',
          },
          Select: {
            borderRadius: 8,
            controlHeight: 36,
          },
          Card: {
            borderRadiusLG: 14,
            paddingLG: 24,
          },
          Breadcrumb: {
            itemColor: '#6b726e',
            lastItemColor: '#1a1f1c',
            linkColor: '#6b726e',
            linkHoverColor: '#1890ff',
          },
          Tabs: {
            itemActiveColor: '#1890ff',
            itemHoverColor: '#40a9ff',
            inkBarColor: '#1890ff',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 2: Commit**

```bash
git add packages/admin/src/main.tsx
git commit -m "feat: switch theme to sky blue and initialize auth on app mount"
```

---

### Task 8: Create LoginPage component

**Files:**
- Create: `packages/admin/src/components/LoginPage.tsx`

- [ ] **Step 1: Create LoginPage.tsx**

```typescript
import React, { useState } from 'react';
import { Input, Button, Form } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useStore } from '../store';

const LoginPage: React.FC = () => {
  const login = useStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [exiting, setExiting] = useState(false);

  const handleSubmit = async (values: { login: string; password: string }) => {
    setError('');
    setLoading(true);
    try {
      await login(values.login, values.password);
      setExiting(true);
    } catch (e: any) {
      setError(e.message ?? 'Login failed');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  if (exiting) {
    return (
      <motion.div
        className="erp-login-page"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      />
    );
  }

  return (
    <div className="erp-login-page">
      {/* Background decorations */}
      <div className="erp-login-bg-waves" />
      <div className="erp-login-bg-squares">
        <div className="erp-login-square erp-login-square-1" />
        <div className="erp-login-square erp-login-square-2" />
        <div className="erp-login-square erp-login-square-3" />
      </div>

      {/* Top-left brand */}
      <div className="erp-login-brand">
        <div className="erp-login-brand-icon">E</div>
        <div>
          <div className="erp-login-brand-name">Agent ERP</div>
          <div className="erp-login-brand-sub">智能企业管理平台</div>
        </div>
      </div>

      {/* Login card */}
      <motion.div
        className="erp-login-card"
        initial={{ opacity: 0, x: 60 }}
        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : { opacity: 1, x: 0 }}
        transition={shake
          ? { duration: 0.4 }
          : { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
        }
      >
        <h2 className="erp-login-title">欢迎登录</h2>
        <p className="erp-login-subtitle">请输入您的账号信息</p>

        <Form onFinish={handleSubmit} layout="vertical" size="large">
          <Form.Item
            name="login"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined className="text-[#bfbfbf]" />}
              placeholder="用户名"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-[#bfbfbf]" />}
              placeholder="密码"
              autoComplete="current-password"
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
              登 录
            </Button>
          </Form.Item>
        </Form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

Expected: no errors (CSS class references don't need type checks, they're in index.css)

- [ ] **Step 3: Write component test for LoginPage**

Create `packages/admin/src/components/__tests__/LoginPage.test.tsx`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../LoginPage';
import { useStore } from '../../store';

// Mock the store
vi.mock('../../store', () => ({
  useStore: vi.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      // Forward className, don't forward animation props
      const { initial, animate, transition, exit, variants, whileHover, whileTap, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('LoginPage', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as any).mockImplementation((selector: any) => {
      const state = { login: mockLogin };
      return selector(state);
    });
  });

  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText('用户名')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('密码')).toBeInTheDocument();
    expect(screen.getByText('登 录')).toBeInTheDocument();
  });

  it('renders brand', () => {
    render(<LoginPage />);
    expect(screen.getByText('Agent ERP')).toBeInTheDocument();
  });

  it('shows validation error on empty submit', async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText('登 录'));
    await waitFor(() => {
      expect(screen.getByText('请输入用户名')).toBeInTheDocument();
    });
  });

  it('calls login on valid submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText('用户名'), 'admin');
    await userEvent.type(screen.getByPlaceholderText('密码'), 'pass');
    fireEvent.click(screen.getByText('登 录'));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'pass');
    });
  });

  it('shows error message on login failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText('用户名'), 'admin');
    await userEvent.type(screen.getByPlaceholderText('密码'), 'wrong');
    fireEvent.click(screen.getByText('登 录'));
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 4: Install testing-library deps if not present**

```bash
pnpm --filter @erp/admin add -D @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

- [ ] **Step 5: Ensure vitest config has jsdom environment**

Check `packages/admin/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: ['e2e/**'],
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

Create `packages/admin/src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 6: Run component tests**

```bash
pnpm --filter @erp/admin test
```

Expected: LoginPage tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/admin/src/components/LoginPage.tsx packages/admin/src/components/__tests__/ packages/admin/src/test-setup.ts packages/admin/vitest.config.ts packages/admin/package.json pnpm-lock.yaml
git commit -m "feat: add LoginPage component with animations, error handling, and tests"
```

---

### Task 9: Add login page CSS styles

**Files:**
- Modify: `packages/admin/src/index.css`

- [ ] **Step 1: Append login page styles to index.css**

Append these styles to the end of `packages/admin/src/index.css`:

```css
/* ── Login page ── */
.erp-login-page {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #096dd9 0%, #1890ff 40%, #40a9ff 100%);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
  z-index: 100;
}

/* Background waves */
.erp-login-bg-waves {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 35%;
  opacity: 0.07;
  pointer-events: none;
}
.erp-login-bg-waves::before {
  content: '';
  position: absolute;
  bottom: 20px;
  left: -5%;
  right: -5%;
  height: 80px;
  background: white;
  border-radius: 60% 40% 0 0 / 100% 100% 0 0;
}
.erp-login-bg-waves::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: -5%;
  right: -5%;
  height: 50px;
  background: white;
  border-radius: 30% 60% 0 0 / 100% 100% 0 0;
}

/* Floating squares */
.erp-login-bg-squares {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.erp-login-square {
  position: absolute;
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 8px;
}
.erp-login-square-1 {
  top: 18%;
  left: 20%;
  width: 36px;
  height: 36px;
  transform: rotate(15deg);
}
.erp-login-square-2 {
  top: 55%;
  left: 10%;
  width: 28px;
  height: 28px;
  background: rgba(255,255,255,0.05);
  border: none;
  transform: rotate(-10deg);
}
.erp-login-square-3 {
  top: 72%;
  left: 30%;
  width: 20px;
  height: 20px;
  border-width: 1.5px;
  transform: rotate(25deg);
}

/* Top-left brand */
.erp-login-brand {
  position: absolute;
  left: 40px;
  top: 28px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  z-index: 2;
}
.erp-login-brand-icon {
  width: 32px;
  height: 32px;
  background: rgba(255,255,255,0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-display);
}
.erp-login-brand-name {
  font-size: 16px;
  font-weight: 700;
  font-family: var(--font-display);
  line-height: 1.2;
}
.erp-login-brand-sub {
  font-size: 10px;
  opacity: 0.6;
  font-family: var(--font-body);
}

/* Login card */
.erp-login-card {
  position: relative;
  z-index: 2;
  background: white;
  border-radius: 12px;
  padding: 32px 28px;
  width: 300px;
  margin-right: 72px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.18);
}

.erp-login-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.erp-login-subtitle {
  font-size: 12px;
  color: #999;
  margin-bottom: 24px;
  font-family: var(--font-body);
}

.erp-login-error {
  color: #ff4d4f;
  font-size: 13px;
  margin-bottom: 12px;
  margin-top: -8px;
  font-family: var(--font-body);
}

.erp-login-btn {
  height: 40px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  background: linear-gradient(135deg, #1890ff, #096dd9) !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(24,144,255,0.3);
}

.erp-login-btn:hover {
  background: linear-gradient(135deg, #40a9ff, #1890ff) !important;
  box-shadow: 0 4px 12px rgba(24,144,255,0.4) !important;
}

/* ── Responsive: mobile ── */
@media (max-width: 640px) {
  .erp-login-page {
    justify-content: center;
    align-items: center;
  }
  .erp-login-card {
    margin-right: 0;
    margin: 0 20px;
    width: 100%;
    max-width: 320px;
    padding: 28px 20px;
  }
  .erp-login-brand {
    left: 50%;
    transform: translateX(-50%);
    top: 40px;
  }
}
```

- [ ] **Step 2: Verify dev server renders without CSS errors**

```bash
pnpm --filter @erp/admin dev
```

Expected: dev server starts, no build errors. Kill after verifying.

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/index.css
git commit -m "feat: add login page styles — sky blue bg, waves, floating card"
```

---

### Task 10: Update index.css — sky blue design tokens

**Files:**
- Modify: `packages/admin/src/index.css`

- [ ] **Step 1: Replace design tokens and green references with sky blue**

Replace the `:root` block (lines 13-28) in `packages/admin/src/index.css`:

```css
:root {
  --color-primary: #1890ff;
  --color-primary-light: #40a9ff;
  --color-primary-soft: rgba(24, 144, 255, 0.08);
  --color-sidebar-from: #061428;
  --color-sidebar-to: #0d1f3c;
  --color-content-bg: #f5f7fa;
  --color-surface: #ffffff;
  --color-border: #e8ecf1;
  --color-border-subtle: #f0f2f5;
  --color-accent: #faad14;
  --color-text: #1a1f1c;
  --color-text-muted: #6b726e;
  --color-text-faint: #9e9890;
  --font-display: 'Syne', sans-serif;
  --font-body: 'DM Sans', sans-serif;
}
```

- [ ] **Step 2: Replace all green color references**

Find and replace color references in index.css:

| Find | Replace |
|------|---------|
| `rgba(27, 107, 74, ` | `rgba(24, 144, 255, ` |
| `#1b6b4a` | `#1890ff` |
| `#2d8a5e` | `#40a9ff` |
| `#4aad7a` | `#69b1ff` |
| `#e07b4c` (accent) | keep, or change to `#faad14` |

You can do this efficiently with sed:

```bash
cd packages/admin/src
sed -i 's/rgba(27, 107, 74,/rgba(24, 144, 255,/g' index.css
sed -i 's/#1b6b4a/#1890ff/g' index.css
sed -i 's/#2d8a5e/#40a9ff/g' index.css
sed -i 's/#4aad7a/#69b1ff/g' index.css
```

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/index.css
git commit -m "feat: switch design tokens to sky blue theme"
```

---

### Task 11: Add login gate to App.tsx

**Files:**
- Modify: `packages/admin/src/App.tsx`

- [ ] **Step 1: Add LoginPage import and auth gate**

Add the import at the top (after existing imports):

```typescript
import LoginPage from './components/LoginPage';
```

- [ ] **Step 2: Add login gate in App component**

Replace the `return` statement in the `App` component. Add this at the very beginning of the return:

```typescript
  if (!user) return <LoginPage />;
```

The `App` component should now look like:

```typescript
const App: React.FC = () => {
  const activeView = useStore((s) => s.activeView);
  const siderCollapsed = useStore((s) => s.siderCollapsed);
  const setSiderCollapsed = useStore((s) => s.setSiderCollapsed);
  const user = useStore((s) => s.user);
  const screens = useBreakpoint();
  const isMobile = screens.md === false;

  if (!user) return <LoginPage />;

  const sidebarContent = (
    <MenuRenderer
      onItemClick={isMobile ? () => setSiderCollapsed(true) : undefined}
    />
  );

  /* ── User presence panel (shared between desktop + mobile) ── */
  const userPresence = (
    <div className="erp-sider-user">
      <div className="erp-sider-user-avatar">
        {(user?.name ?? 'Guest').charAt(0).toUpperCase()}
      </div>
      <div className="erp-sider-user-info">
        <div className="erp-sider-user-name">{user?.name ?? 'Guest'}</div>
        <div className="erp-sider-user-status">
          <span className="erp-sider-user-dot" />
          online
        </div>
      </div>
      <SettingOutlined
        className="text-xs"
        style={{ color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
      />
    </div>
  );

  return (
    <Layout className="h-screen">
      {/* ... rest unchanged ... */}
    </Layout>
  );
};
```

**Important:** The `if (!user) return <LoginPage />;` must be placed BEFORE the `sidebarContent` and `userPresence` variable declarations, since those use `<MenuRenderer onItemClick=...>` and `user?.name` which would fail or look wrong without a user. Place the gate right after the hooks and before any JSX-related variable declarations.

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add packages/admin/src/App.tsx
git commit -m "feat: add login gate — show LoginPage when user is null"
```

---

### Task 12: Wire up AppHeader logout

**Files:**
- Modify: `packages/admin/src/components/AppHeader.tsx`

- [ ] **Step 1: Add logout handler to AppHeader**

Add `logout` to the store selector and a `handleMenuClick` handler. Replace the component:

```typescript
import React from 'react';
import { Layout, Button, Breadcrumb, Dropdown, Space } from 'antd';
import type { MenuProps } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import { useStore } from '../store';

const { Header } = Layout;

export const AppHeader: React.FC = () => {
  const siderCollapsed = useStore((s) => s.siderCollapsed);
  const setSiderCollapsed = useStore((s) => s.setSiderCollapsed);
  const breadcrumbs = useStore((s) => s.breadcrumbs);
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);

  const breadcrumbItems =
    breadcrumbs.length > 0
      ? breadcrumbs.map((b) => ({ title: b.name }))
      : [{ title: 'Home' }];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout();
    }
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <ProfileOutlined />, label: 'My Profile' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
  ];

  return (
    <Header className="erp-header flex items-center justify-between px-4 h-12 leading-[48px]">
      <div className="flex items-center gap-3">
        <Button
          type="text"
          icon={
            siderCollapsed ? (
              <MenuUnfoldOutlined className="text-[#6b726e]" />
            ) : (
              <MenuFoldOutlined className="text-[#6b726e]" />
            )
          }
          onClick={() => setSiderCollapsed(!siderCollapsed)}
        />
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} placement="bottomRight">
        <Space className="cursor-pointer hover:opacity-80 transition-opacity">
          <div className="erp-user-avatar">
            {(user?.name ?? 'Guest').charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-[#1a1f1c] hidden sm:inline">
            {user?.name ?? 'Guest'}
          </span>
        </Space>
      </Dropdown>
    </Header>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/admin/src/components/AppHeader.tsx
git commit -m "feat: wire logout action in AppHeader user dropdown"
```

---

### Task 13: E2E test — login flow

**Files:**
- Create: `packages/admin/e2e/login.spec.ts`

- [ ] **Step 1: Create login e2e test**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('shows login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.erp-login-page')).toBeVisible();
    await expect(page.locator('.erp-login-card')).toBeVisible();
  });

  test('shows brand in top-left', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.erp-login-brand-name')).toHaveText('Agent ERP');
  });

  test('shows validation errors for empty form', async ({ page }) => {
    await page.goto('/');
    await page.locator('.erp-login-btn').click();
    await expect(page.getByText('请输入用户名')).toBeVisible();
    await expect(page.getByText('请输入密码')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="用户名"]').fill('wrong');
    await page.locator('input[placeholder="密码"]').fill('wrong');
    await page.locator('.erp-login-btn').click();
    await expect(page.locator('.erp-login-error')).toBeVisible({ timeout: 10000 });
  });

  test('logs out and returns to login', async ({ page }) => {
    // This test requires a valid user in DB — skip if not set up
    test.skip();
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add packages/admin/e2e/login.spec.ts
git commit -m "test: add login page e2e tests"
```

---

### Task 14: Final verification

- [ ] **Step 1: Build check — all packages compile**

```bash
pnpm build
```

Expected: all packages build without errors.

- [ ] **Step 2: Run unit tests**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 3: Start dev server and check manually**

```bash
pnpm --filter @erp/admin dev
```

Open http://localhost:3000. Verify:
- Login page renders with sky blue background
- Brand shows top-left
- Login card floats on the right
- Background has waves and floating squares
- Empty form submission shows validation errors
- Entering wrong credentials shows inline error
- (With a valid user in DB) successful login transitions to admin shell
- Logout returns to login page
- Page refresh restores session from localStorage token

- [ ] **Step 4: Commit any remaining changes**

```bash
git status
git add <any remaining files>
git commit -m "chore: final verification tweaks"
```
