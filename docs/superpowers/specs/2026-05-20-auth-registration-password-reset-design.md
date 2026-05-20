# Auth: User Registration & Password Reset

**Date:** 2026-05-20
**Status:** Approved

## Overview

Add self-service user registration (with email verification) and forgot-password flow to the existing JWT-based auth system. Refactor auth endpoints from `vite.config.ts` middleware into a proper auth controller.

## User Flows

### Registration
1. User clicks "Create account" on Login page
2. Fills form: name, email, login, password, confirm password
3. Server creates user with `active = false`, generates 6-digit verification code (console-logged in dev mode)
4. User enters code on verification screen
5. Account activated, redirected to login

### Password Reset
1. User clicks "Forgot password?" on Login page
2. Enters email address
3. Server generates 6-digit reset code (console-logged in dev mode)
4. User enters code + new password + confirm
5. Password updated, redirected to login

## Backend Design

### Auth Controller (`modules/base/controllers/auth_controller.ts`)

All auth endpoints in one controller class. Each endpoint `auth: false` (no token required).

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/login` | Authenticate user (moved from vite.config.ts) |
| POST | `/api/auth/register` | Create inactive user, generate verification code |
| POST | `/api/auth/verify-registration` | Verify code, activate user |
| POST | `/api/auth/forgot-password` | Generate reset code for email |
| POST | `/api/auth/reset-password` | Verify code, set new password |

### Verification Code Table

```sql
CREATE TABLE erp_verification_codes (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES res_users(id) ON DELETE CASCADE,
  code        VARCHAR(6) NOT NULL,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('register', 'reset')),
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Verification Utilities (`packages/core/src/auth/verification.ts`)

- `generateCode()` — 6-digit random via `crypto.randomInt`
- `storeCode(db, userId, type)` — inserts row, returns code
- `verifyCode(db, userId, code, type)` — validates (match, not expired, not used), marks used, returns boolean
- Code expiry: 10 minutes
- Expired codes cleaned up lazily on verify attempt

### Vite Middleware Change

Remove inline login handler from `vite.config.ts`. The existing generic controller route matcher will pick up the auth controller routes automatically.

## Frontend Design

### Auth View State

Since there's no React Router, a Zustand store field `authView` controls which auth page renders:
`'login' | 'register' | 'verify-registration' | 'forgot-password' | 'reset-password'`

### Pages

| Page | Steps |
|------|-------|
| **LoginPage** (updated) | Add "Create account" link (left) and "Forgot password?" link (right) below login button |
| **RegisterPage** | Step 1: name + email + login + password + confirm. Step 2: 6-digit code input |
| **ForgotPasswordPage** | Step 1: email. Step 2: code + new password + confirm |

### CodeInput Component

Reusable 6-digit input — 6 individual boxes, auto-focus/advance on digit entry, calls `onComplete(code)` when all 6 digits filled. Used by both RegisterPage and ForgotPasswordPage.

### Store Actions (new)

- `register(data)` → POST `/api/auth/register`
- `verifyRegistration(userId, code)` → POST `/api/auth/verify-registration`
- `forgotPassword(email)` → POST `/api/auth/forgot-password`
- `resetPassword(userId, code, password)` → POST `/api/auth/reset-password`

### Styling

All new pages reuse the existing LoginPage design system: light blue-white background (`#f0f4ff`), radial gradient blobs, centered white card, framer-motion animations (fade + slide entrance, shake on error).

## Error Handling

| Scenario | Response |
|----------|----------|
| Duplicate login/email | 409, field-specific message |
| Invalid code | 400, generic message (don't distinguish expired vs wrong) |
| Expired code | 400, "code expired" |
| Already-used code | 400, "code already used" |
| User not found (forgot password) | 200, "if email exists, a code was sent" |
| Rate limit | Max 5 code attempts per user, max 3 resends per 10 minutes |
| Password validation | Minimum 6 characters |

## Files

### New (7)
- `modules/base/controllers/auth_controller.ts`
- `packages/core/src/auth/verification.ts`
- `packages/admin/src/components/RegisterPage.tsx`
- `packages/admin/src/components/ForgotPasswordPage.tsx`
- `packages/admin/src/components/CodeInput.tsx`
- Migration SQL for `erp_verification_codes`

### Modified (5)
- `packages/admin/vite.config.ts` — remove inline login handler
- `packages/admin/src/store.ts` — add authView + actions
- `packages/admin/src/App.tsx` — auth view routing
- `packages/admin/src/components/LoginPage.tsx` — add links
- `modules/base/index.ts` — export auth controller

## Testing

| Layer | Tests |
|-------|-------|
| Unit (vitest) | `verification.ts` — generate, store, verify, expiry |
| Unit (vitest) | Auth controller endpoints with mocked env |
| e2e (Playwright) | Registration: form → code → activate → login |
| e2e (Playwright) | Password reset: email → code → reset → login |
| e2e (Playwright) | Errors: duplicate registration, wrong code, expired code |
