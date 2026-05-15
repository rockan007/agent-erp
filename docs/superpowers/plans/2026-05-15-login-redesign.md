# Login Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign login page with centered floating card on light gradient-blob background, refined inputs and button, brand mark changed to "A".

**Architecture:** Two-file change — rewrite `LoginPage.tsx` (background blobs instead of waves/squares, centered card, logo "A"), update login CSS in `index.css` (remove old decorations, add blob/card/input styles).

**Tech Stack:** React 18, Ant Design 5, Tailwind CSS 3, framer-motion

---

### Task 1: Rewrite LoginPage component

**Files:**
- Modify: `packages/admin/src/components/LoginPage.tsx`

- [ ] **Step 1: Replace LoginPage component**

Replace the entire content of `LoginPage.tsx`. Key changes:
- Remove `erp-login-bg-waves` and `erp-login-bg-squares` decoration divs
- Replace with 3 gradient blob divs (`erp-login-blob-1/2/3`)
- Change brand logo initial from "E" to "A"
- Add `erp-login-input` className to Input and Input.Password for custom styling
- No other structural changes (shake, exit, form logic all preserved)

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
      {/* Gradient blobs */}
      <div className="erp-login-blob erp-login-blob-1" />
      <div className="erp-login-blob erp-login-blob-2" />
      <div className="erp-login-blob erp-login-blob-3" />

      {/* Top-left brand */}
      <div className="erp-login-brand">
        <div className="erp-login-brand-icon">A</div>
        <div>
          <div className="erp-login-brand-name">Agent ERP</div>
          <div className="erp-login-brand-sub">智能企业管理平台</div>
        </div>
      </div>

      {/* Login card */}
      <motion.div
        className="erp-login-card"
        initial={{ opacity: 0, y: 24 }}
        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : { opacity: 1, y: 0 }}
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
              className="erp-login-input"
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

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/components/LoginPage.tsx
git commit -m "feat: redesign login page — gradient blobs, centered card, brand logo A"
```

---

### Task 2: Replace login page CSS

**Files:**
- Modify: `packages/admin/src/index.css`

- [ ] **Step 1: Remove old login styles and add new ones**

Remove the entire `/* ── Login page ── */` section plus the waves, squares, brand, card, error, button, and responsive blocks (old lines 259-441). Then append new styles.

**Remove these blocks:**
1. `/* ── Login page ── */` — `.erp-login-page` (the old full-screen gradient background)
2. `/* Background waves */` — `.erp-login-bg-waves` and its pseudo-elements
3. `/* Floating squares */` — `.erp-login-bg-squares` and all `.erp-login-square*` rules
4. `/* Top-left brand */` — `.erp-login-brand`, `.erp-login-brand-icon/name/sub`
5. `/* Login card */` — old `.erp-login-card` with right-aligned styles
6. `.erp-login-title`, `.erp-login-subtitle`, `.erp-login-error`
7. `.erp-login-btn` and `.erp-login-btn:hover`
8. `/* ── Responsive: mobile ── */` — old `@media (max-width: 640px)` login rules

**Find and replace the old login section.** The exact text to match starts with `/* ── Login page ── */` and ends with the closing `}` of the mobile responsive block (before `/* ── Dashboard ── */`).

Replace with:

```css
/* ── Login page ── */
.erp-login-page {
  position: fixed;
  inset: 0;
  background: #f0f4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 100;
}

/* Gradient blobs */
.erp-login-blob {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.erp-login-blob-1 {
  top: -80px;
  right: -60px;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(24, 144, 255, 0.15), transparent 70%);
}
.erp-login-blob-2 {
  bottom: -80px;
  left: -50px;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(114, 46, 209, 0.10), transparent 70%);
}
.erp-login-blob-3 {
  top: 35%;
  left: 55%;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, rgba(24, 144, 255, 0.06), transparent 70%);
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
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-display);
  color: white;
  box-shadow: 0 2px 10px rgba(24, 144, 255, 0.3);
}
.erp-login-brand-name {
  font-size: 16px;
  font-weight: 700;
  font-family: var(--font-display);
  line-height: 1.2;
  color: #1a1a1a;
}
.erp-login-brand-sub {
  font-size: 10px;
  color: #9e9890;
  font-family: var(--font-body);
}

/* Login card */
.erp-login-card {
  position: relative;
  z-index: 2;
  background: white;
  border-radius: 18px;
  padding: 38px 32px;
  width: 320px;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.03),
    0 12px 36px rgba(0, 0, 0, 0.08);
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

/* Login input overrides */
.erp-login-input {
  height: 42px;
  border-radius: 10px;
  background: #f7f8fa;
  border-color: #e8ecf1;
}
.erp-login-input.ant-input-affix-wrapper {
  background: #f7f8fa;
  border-color: #e8ecf1;
}
.erp-login-input.ant-input-affix-wrapper-focused {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.08);
}

.erp-login-btn {
  height: 44px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  background: linear-gradient(135deg, #1890ff, #096dd9) !important;
  border: none !important;
  box-shadow: 0 4px 14px rgba(24, 144, 255, 0.3);
}

.erp-login-btn:hover {
  background: linear-gradient(135deg, #40a9ff, #1890ff) !important;
  box-shadow: 0 6px 18px rgba(24, 144, 255, 0.4) !important;
}

/* ── Responsive: mobile ── */
@media (max-width: 640px) {
  .erp-login-blob-1 {
    top: -60px;
    right: -40px;
    width: 200px;
    height: 200px;
  }
  .erp-login-blob-2 {
    bottom: -60px;
    left: -30px;
    width: 180px;
    height: 180px;
  }
  .erp-login-blob-3 {
    top: 30%;
    left: 50%;
    width: 100px;
    height: 100px;
  }

  .erp-login-brand {
    left: 50%;
    transform: translateX(-50%);
    top: 40px;
  }

  .erp-login-card {
    margin: 0 20px;
    width: 100%;
    max-width: 320px;
    padding: 28px 22px;
    border-radius: 16px;
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/index.css
git commit -m "feat: add login page blob background, centered card, and refined input styles"
```

---

### Task 3: Final verification

- [ ] **Step 1: TypeScript check**

```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Run all tests**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 3: Start dev server and verify visually**

```bash
pnpm --filter @erp/admin dev
```

Open browser, verify:
- Login page: light blue-white background with 3 gradient blobs
- Brand: "A" logo + "Agent ERP" + "智能企业管理平台" in top-left
- Card: centered, white, 18px rounded, dual shadow
- Inputs: 10px rounded, `#f7f8fa` background
- Button: gradient with blue glow shadow
- Login flow works (valid → dashboard, invalid → error shake)
- Exit fade on successful login
- Mobile (< 640px): brand centers top, card adapts, blobs smaller

- [ ] **Step 4: Commit any remaining changes**

```bash
git status
git add <remaining files>
git commit -m "chore: final login page verification tweaks"
```
