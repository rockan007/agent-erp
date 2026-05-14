# Login Page Design

**Date:** 2026-05-14
**Status:** Approved

## Overview

Add complete authentication flow to Agent ERP: login page UI, JWT-based auth, bcrypt password hashing, and session persistence.

## Architecture

```
packages/core/src/auth/
├── password.ts       # bcrypt hash / compare
└── token.ts          # JWT sign / verify (jsonwebtoken)

packages/admin/src/
├── components/
│   └── LoginPage.tsx # Login page component
├── App.tsx           # Gate: user==null → LoginPage, else → admin shell
└── store.ts          # +login(), +logout(), token persistence
```

**API endpoint** (Vite dev server middleware):
```
POST /api/auth/login  { login: string, password: string }
  → 200 { token: string, user: { id, name, groups } }
  → 401 { error: "Invalid credentials" }
```

**Auth flow:**
1. LoginPage → `store.login(login, password)` → POST `/api/auth/login`
2. Success → `store.setUser(user)`, `localStorage.setItem('token', token)`, renders admin shell
3. Failure → show inline error message, shake animation
4. Page refresh → store reads token from localStorage → if valid, skip login
5. Logout → AppHeader "退出登录" → clear token + user → back to LoginPage

## Visual Design

### Layout
- Full-screen sky blue gradient background (`#096dd9` → `#1890ff` → `#40a9ff`)
- Top-left: logo icon (rounded square with "E") + "Agent ERP" title + subtitle "智能企业管理平台"
- Right side: white floating login card (260px max-width, 12px border-radius, `box-shadow: 0 12px 40px rgba(0,0,0,0.18)`)

### Background Decoration
- Bottom waves: two overlapping white arcs at 7% opacity
- Floating squares: 2-3 small rotated squares/borders scattered at 5-10% opacity

### Form Elements
- Title: "欢迎登录" + subtitle "请输入您的账号信息"
- Username input: Ant Design Outlined style, gray border, sky blue on focus
- Password input: same style, masked
- Login button: sky blue gradient fill, white text, full width
- Error: red inline text below inputs, Ant Design `Input` `status="error"`

### Animations (framer-motion)
- Page enter: card slides in from right + fades in (400ms)
- Login loading: button shows spinner, disabled
- Login error: inputs shake horizontally (like macOS login)
- Login success: card scales down and fades out, admin shell fades in (300ms)

## Technical Details

### Password Handling
- `@erp/core/src/auth/password.ts`: `hashPassword(plain: string)` and `verifyPassword(plain: string, hash: string)` using bcrypt
- Migrate `ResUsers.password` from AES encryption to bcrypt hash

### JWT
- `@erp/core/src/auth/token.ts`: `signToken(user)` and `verifyToken(token)` using jsonwebtoken
- Payload: `{ userId, groups }`, expiry: 24h
- Secret from env `JWT_SECRET` (default: `erp-dev-secret`)

### Store Changes
```typescript
// Added to AppState:
token: string | null;
login: (login: string, password: string) => Promise<void>;
logout: () => void;
initializeAuth: () => void; // called on app mount, reads localStorage
```

### App.tsx Gate
```typescript
if (!user) return <LoginPage />;
return <Layout>...</Layout>; // existing admin shell
```

### Backend (Vite Middleware)
- Add Vite plugin or `configureServer` hook in `vite.config.ts`
- Handle `POST /api/auth/login`: parse body, look up user by login in `res_users` table, bcrypt compare, return JWT
- Read `JWT_SECRET` from env

## Files Changed

| File | Action |
|------|--------|
| `packages/core/src/auth/password.ts` | New — bcrypt utils |
| `packages/core/src/auth/token.ts` | New — JWT utils |
| `packages/core/package.json` | Add bcrypt, jsonwebtoken deps |
| `packages/admin/src/components/LoginPage.tsx` | New — login page |
| `packages/admin/src/App.tsx` | Add login gate |
| `packages/admin/src/store.ts` | Add auth actions, token persistence |
| `packages/admin/vite.config.ts` | Add `/api/auth/login` middleware |
| `packages/admin/package.json` | Add framer-motion dep (already exists) |

## Testing

- **Unit**: `password.test.ts` (hash/compare), `token.test.ts` (sign/verify/expiry)
- **Component**: `LoginPage.test.tsx` (form render, validation, error display, loading state)
- **Integration**: store auth flow (login success/failure, logout, token restore)
- **E2E**: `login.spec.ts` — visit page, enter credentials, submit, verify redirect to admin; logout returns to login; token restore on reload
