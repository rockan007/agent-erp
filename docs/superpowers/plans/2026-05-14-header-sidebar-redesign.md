# Header & Sidebar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the top header bar and left sidebar with brand-colored header, light sidebar, sectioned navigation, hamburger collapse, and breadcrumb moved to content area.

**Architecture:** Three-component change — rewrite `AppHeader.tsx` (brand logo + user pill, no breadcrumb), update sidebar layout in `App.tsx` (light theme, hamburger, section labels, remove brand/user presence), add breadcrumb to `PageHeader.tsx` and content area. All new styles in `index.css`.

**Tech Stack:** React 18, Ant Design 5, Tailwind CSS 3, framer-motion

---

### Task 1: Rewrite AppHeader with brand logo and user pill

**Files:**
- Modify: `packages/admin/src/components/AppHeader.tsx`

- [ ] **Step 1: Replace AppHeader component**

Replace the entire content of `AppHeader.tsx`. The new header has brand logo+name on the left, notification bell and user pill on the right. Breadcrumb moves out, collapse button moves out.

```typescript
import React from 'react';
import { Layout, Button, Dropdown, Space } from 'antd';
import type { MenuProps } from 'antd';
import {
  BellOutlined,
  LogoutOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import { useStore } from '../store';

const { Header } = Layout;

export const AppHeader: React.FC = () => {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);

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
    <Header className="erp-header-brand flex items-center justify-between px-5 h-[52px] leading-[52px]">
      {/* Left: brand */}
      <div className="flex items-center gap-2.5">
        <div className="erp-brand-mark" style={{ width: 28, height: 28, fontSize: 13 }}>
          A
        </div>
        <span
          className="text-white font-bold text-[15px] tracking-[-0.01em]"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Agent ERP
        </span>
      </div>

      {/* Right: notification + user pill */}
      <div className="flex items-center gap-3">
        <Button
          type="text"
          icon={<BellOutlined style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }} />}
          className="erp-header-notify-btn"
        />
        <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} placement="bottomRight">
          <Space className="erp-header-user-pill cursor-pointer">
            <div className="erp-header-user-avatar">
              {(user?.name ?? 'Guest').charAt(0).toUpperCase()}
            </div>
            <span className="erp-header-user-name">
              {user?.name ?? 'Guest'}
            </span>
            <span className="erp-header-user-arrow">▾</span>
          </Space>
        </Dropdown>
      </div>
    </Header>
  );
};
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/components/AppHeader.tsx
git commit -m "feat: redesign header — brand logo left, notification bell, user pill"
```

---

### Task 2: Update sidebar layout in App.tsx

**Files:**
- Modify: `packages/admin/src/App.tsx`

- [ ] **Step 1: Update sidebar section in App.tsx**

Replace the sidebar desktop and mobile sections. Key changes:
- Remove brand area from sidebar (moved to header)
- Remove `userPresence` from sidebar (consolidated in header)
- Add hamburger collapse button at sidebar top
- Change theme from `"dark"` to `"light"` on Sider
- Update `className` from `"erp-sider"` to `"erp-sider-light"`
- Update collapsed width section

In App.tsx, find and remove lines 199-217 (the `userPresence` declaration). Then replace the desktop sidebar section (lines 224-268) and mobile drawer section (lines 270-312).

Replace lines 224-268:

```typescript
        {/* Desktop sidebar */}
        {!isMobile && (
          <Sider
            width={220}
            collapsedWidth={64}
            collapsible
            collapsed={siderCollapsed}
            onCollapse={(v) => setSiderCollapsed(v)}
            theme="light"
            trigger={null}
            className="erp-sider-light"
          >
            {/* Sidebar top: section label + hamburger */}
            <div className="erp-sider-top">
              {!siderCollapsed && (
                <span className="erp-sider-section-label">导航菜单</span>
              )}
              <button
                type="button"
                className="erp-sider-collapse-btn"
                onClick={() => setSiderCollapsed(!siderCollapsed)}
              >
                <span className="erp-hamburger-line" />
                <span className="erp-hamburger-line" />
                <span className="erp-hamburger-line" />
              </button>
            </div>

            {sidebarContent}
          </Sider>
        )}
```

Replace lines 270-312 (mobile drawer):

```typescript
        {/* Mobile drawer */}
        {isMobile && (
          <Drawer
            open={!siderCollapsed}
            onClose={() => setSiderCollapsed(true)}
            placement="left"
            width={220}
            styles={{
              body: { padding: 0, background: '#fafbfc' },
              wrapper: { background: 'transparent' },
            }}
            closeIcon={null}
          >
            <div className="erp-sider-light flex flex-col h-full">
              <div className="erp-sider-top px-3">
                <span className="erp-sider-section-label">导航菜单</span>
                <button
                  type="button"
                  className="erp-sider-collapse-btn"
                  onClick={() => setSiderCollapsed(true)}
                >
                  <span className="erp-hamburger-line" />
                  <span className="erp-hamburger-line" />
                  <span className="erp-hamburger-line" />
                </button>
              </div>
              <div className="flex-1" style={{ overflow: 'hidden' }}>
                {sidebarContent}
              </div>
            </div>
          </Drawer>
        )}
```

Also update the content area to add a breadcrumb bar before the activeView/WelcomeScreen split. Replace lines 314-330:

```typescript
        {/* Content */}
        <Content className="erp-content" style={{ overflow: 'auto' }}>
          {activeView ? (
            <div className="erp-animate-in">
              <PageHeader view={activeView} />
              <div className="px-6 py-6">
                <ErrorBoundary>
                  <ViewRenderer view={activeView} />
                </ErrorBoundary>
              </div>
            </div>
          ) : (
            <>
              <div className="erp-content-breadcrumb">
                <span className="erp-breadcrumb-home">Home</span>
              </div>
              <ErrorBoundary>
                <WelcomeScreen />
              </ErrorBoundary>
            </>
          )}
        </Content>
```

Also remove the unused `SettingOutlined` import (line 3) since `userPresence` is removed. Replace:

```typescript
import { SettingOutlined } from '@ant-design/icons';
```

with nothing (remove the line entirely).

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/App.tsx
git commit -m "feat: redesign sidebar — light theme, hamburger collapse, remove brand and user presence"
```

---

### Task 3: Add breadcrumb to PageHeader

**Files:**
- Modify: `packages/admin/src/components/PageHeader.tsx`

- [ ] **Step 1: Add breadcrumb to PageHeader**

Add `Breadcrumb` import and render breadcrumb at top of the page header. The breadcrumb reads from the store.

```typescript
import React from 'react';
import { Typography, Space, Breadcrumb } from 'antd';
import { ViewSpec, useStore } from '../store';

const { Title } = Typography;

interface Props {
  view: ViewSpec;
}

export const PageHeader: React.FC<Props> = ({ view }) => {
  const breadcrumbs = useStore((s) => s.breadcrumbs);

  const breadcrumbItems =
    breadcrumbs.length > 0
      ? breadcrumbs.map((b) => ({ title: b.name }))
      : [{ title: 'Home' }];

  return (
    <div className="erp-page-header px-6 py-3">
      <Breadcrumb
        items={breadcrumbItems}
        className="erp-page-breadcrumb"
      />
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 rounded-full bg-[#1890ff]" />
          <Title level={5} className="!mb-0 text-[#1a1f1c] tracking-tight">
            {view.title}
          </Title>
        </div>
        <Space>{/* Action buttons area */}</Space>
      </div>
    </div>
  );
};
```

Note: Since `ViewSpec` is imported from `../types` and `useStore` from `../store`, the imports need to be updated. Check the existing import for `ViewSpec` — it currently imports from `'../store'`. If `useStore` is not already exported, add it.

Actually, check the current import: `import { ViewSpec } from '../store';`. The `useStore` hook is already exported from `'../store'`. Just add `useStore` to the existing import.

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/components/PageHeader.tsx
git commit -m "feat: add breadcrumb to page header"
```

---

### Task 4: Replace sidebar/header CSS

**Files:**
- Modify: `packages/admin/src/index.css`

- [ ] **Step 1: Remove old sidebar and header styles, add new ones**

Remove these blocks from `index.css`:
1. `/* ── Sidebar ── */` section (lines 56-136) — dark sidebar styles, menu items, etc.
2. `/* ── Sidebar user presence ── */` section (lines 138-202) — user avatar, name, status, dot
3. `/* ── Glass header ── */` section (lines 204-225) — old glass morphism header
4. `.erp-sider-footer` block (lines 133-136, if not already removed)
5. `.erp-header .ant-breadcrumb` blocks (lines 213-225)

Keep these blocks:
- `.erp-sider .ant-layout-sider-trigger` (lines 477-480)
- `/* ── Sidebar toggle button ── */` section
- All dashboard styles, login page styles, table, form, card styles

Then append new styles at end of file:

```css
/* ── Brand Header ── */
.erp-header-brand {
  background: linear-gradient(135deg, #1890ff, #096dd9) !important;
  border-bottom: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.erp-header-notify-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}
.erp-header-notify-btn:hover {
  background: rgba(255, 255, 255, 0.12) !important;
}

.erp-header-user-pill {
  padding: 4px 12px 4px 5px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  gap: 7px;
  transition: background 0.2s ease;
}
.erp-header-user-pill:hover {
  background: rgba(255, 255, 255, 0.22);
}

.erp-header-user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 11px;
  font-family: var(--font-display);
}
.erp-header-user-name {
  color: white;
  font-size: 12px;
  font-weight: 500;
  font-family: var(--font-body);
}
.erp-header-user-arrow {
  color: rgba(255, 255, 255, 0.4);
  font-size: 9px;
  margin-left: 1px;
}

/* ── Light Sidebar ── */
.erp-sider-light {
  background: #fafbfc !important;
  border-right: 1px solid #e8ecf1;
  overflow: auto;
}

.erp-sider-light .ant-layout-sider-children {
  display: flex;
  flex-direction: column;
}

.erp-sider-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 10px 4px 12px;
  flex-shrink: 0;
}

.erp-sider-section-label {
  font-size: 9px;
  color: #9e9890;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  font-family: var(--font-body);
}

.erp-sider-collapse-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 4px;
  transition: background 0.15s ease;
}
.erp-sider-collapse-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

.erp-hamburger-line {
  width: 14px;
  height: 1.5px;
  background: #9e9890;
  border-radius: 1px;
  display: block;
}

/* Light sidebar menu overrides */
.erp-sider-light .ant-menu.ant-menu-light {
  background: transparent;
  border-inline-end: none !important;
  padding: 4px 8px;
  flex: 1;
  font-family: var(--font-body);
}

.erp-sider-light .ant-menu-light .ant-menu-item {
  margin: 2px 0;
  border-radius: 0 6px 6px 0;
  font-size: 12.5px;
  padding-left: 14px !important;
  border-left: 3px solid transparent;
  height: auto;
  line-height: 1.4;
  padding-top: 9px;
  padding-bottom: 9px;
  color: #6b726e;
  transition: all 0.15s ease;
}

.erp-sider-light .ant-menu-light .ant-menu-item:hover {
  color: #1a1f1c;
  background: rgba(0, 0, 0, 0.03);
}

.erp-sider-light .ant-menu-light .ant-menu-item-selected {
  color: #1890ff;
  font-weight: 600;
  background: rgba(24, 144, 255, 0.05);
  border-left-color: #1890ff;
}

.erp-sider-light .ant-menu-light .ant-menu-item .anticon {
  font-size: 14px;
}

.erp-sider-light .ant-menu-light .ant-menu-item-selected .anticon {
  color: #1890ff;
}

.erp-sider-light .ant-menu-light .ant-menu-submenu-title {
  margin: 2px 0;
  border-radius: 0 6px 6px 0;
  font-size: 12.5px;
  padding-left: 14px !important;
  border-left: 3px solid transparent;
  height: auto;
  line-height: 1.4;
  padding-top: 9px;
  padding-bottom: 9px;
  color: #6b726e;
}

.erp-sider-light .ant-menu-light .ant-menu-submenu-title:hover {
  color: #1a1f1c;
  background: rgba(0, 0, 0, 0.03);
}

/* Content breadcrumb */
.erp-content-breadcrumb {
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #f0f2f5;
  display: flex;
  align-items: center;
}

.erp-breadcrumb-home {
  font-size: 11.5px;
  color: #9e9890;
  font-family: var(--font-body);
}

.erp-page-breadcrumb {
  font-size: 12px;
}
.erp-page-breadcrumb .ant-breadcrumb-separator {
  color: #d0d4d9;
}
.erp-page-breadcrumb a,
.erp-page-breadcrumb span {
  color: #6b726e;
}
.erp-page-breadcrumb li:last-child span {
  color: #1a1f1c;
  font-weight: 500;
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
git commit -m "feat: add light sidebar, brand header, and breadcrumb styles"
```

---

### Task 5: Final verification

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

Open browser, login, verify:
- Header: brand gradient background, logo "A" + "Agent ERP" on left, bell icon + user pill on right
- Sidebar: light background (#fafbfc), hamburger at top-right, section label "导航菜单", left-bar active state
- Collapse: click hamburger, sidebar collapses to 64px icons
- Breadcrumb: visible in content area for active views and dashboard
- User dropdown: click user pill, shows My Profile / Logout
- Mobile: drawer opens with light sidebar

- [ ] **Step 4: Commit any remaining changes**

```bash
git status
git add <remaining files>
git commit -m "chore: final header/sidebar verification tweaks"
```
