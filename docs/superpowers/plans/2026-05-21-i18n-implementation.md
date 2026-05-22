# i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add zh_CN/en_US internationalization to the Agent ERP admin UI, Ant Design components, and API error messages using i18next.

**Architecture:** Frontend uses `react-i18next` with JSON files by namespace (common/auth/dashboard), integrated with Ant Design's `ConfigProvider` locale. Backend uses `i18next` in Node.js with `getFixedT(lang)` for per-request locale resolution. Language is detected from `localStorage` → `navigator.language`, with a manual dropdown switcher in the header.

**Tech Stack:** i18next, react-i18next, i18next-browser-languagedetector, Ant Design 5 locale

---

### Task 1: Install i18n dependencies

**Files:**
- Modify: `packages/admin/package.json`
- Modify: `packages/core/package.json`

- [ ] **Step 1: Install admin dependencies**

Run:
```bash
pnpm --filter @erp/admin add i18next react-i18next i18next-browser-languagedetector
```

Expected: packages added to `packages/admin/package.json` dependencies.

- [ ] **Step 2: Install core dependency**

Run:
```bash
pnpm --filter @erp/core add i18next
```

Expected: package added to `packages/core/package.json` dependencies.

- [ ] **Step 3: Verify install**

Run:
```bash
pnpm install
```

Expected: `pnpm install` completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/admin/package.json packages/core/package.json pnpm-lock.yaml
git commit -m "chore: add i18next dependencies for i18n support"
```

---

### Task 2: Create locale JSON files

**Files:**
- Create: `packages/admin/src/locales/zh_CN/common.json`
- Create: `packages/admin/src/locales/zh_CN/auth.json`
- Create: `packages/admin/src/locales/zh_CN/dashboard.json`
- Create: `packages/admin/src/locales/en_US/common.json`
- Create: `packages/admin/src/locales/en_US/auth.json`
- Create: `packages/admin/src/locales/en_US/dashboard.json`

- [ ] **Step 1: Create zh_CN/common.json**

```json
{
  "brand": {
    "subtitle": "智能企业管理平台"
  },
  "menu": {
    "navigation": "导航菜单"
  }
}
```

- [ ] **Step 2: Create zh_CN/auth.json**

```json
{
  "login": {
    "title": "欢迎登录",
    "subtitle": "请输入您的账号信息",
    "username": "用户名",
    "password": "密码",
    "usernamePlaceholder": "请输入用户名",
    "passwordPlaceholder": "请输入密码",
    "submit": "登 录",
    "usernameRequired": "请输入用户名",
    "passwordRequired": "请输入密码"
  }
}
```

- [ ] **Step 3: Create zh_CN/dashboard.json**

```json
{
  "greeting": {
    "morning": "早上好, {{name}}",
    "subtitle": "以下是您的业务概览"
  },
  "stats": {
    "activeUsers": "活跃用户",
    "partners": "合作伙伴",
    "monthlyOrders": "本月订单",
    "revenue": "营收 (K)",
    "vsLastMonth": "vs 上月"
  },
  "chart": {
    "monthlyTrend": "月度趋势",
    "month": "月"
  },
  "activity": {
    "recent": "最近动态",
    "orderCreated": "{{name}} 创建了新订单 #{{id}}",
    "partnerUpdated": "{{name}} 更新了合作伙伴信息",
    "reportSubmitted": "{{name}} 提交了月度报表",
    "backupCompleted": "系统 完成了数据备份"
  },
  "actions": {
    "createOrder": "新建订单",
    "addPartner": "添加伙伴",
    "reports": "报表中心",
    "settings": "系统设置",
    "import": "导入数据"
  }
}
```

- [ ] **Step 4: Create en_US/common.json**

```json
{
  "brand": {
    "subtitle": "Intelligent Enterprise Management Platform"
  },
  "menu": {
    "navigation": "Navigation Menu"
  }
}
```

- [ ] **Step 5: Create en_US/auth.json**

```json
{
  "login": {
    "title": "Welcome Back",
    "subtitle": "Please enter your account credentials",
    "username": "Username",
    "password": "Password",
    "usernamePlaceholder": "Please enter username",
    "passwordPlaceholder": "Please enter password",
    "submit": "Login",
    "usernameRequired": "Please enter your username",
    "passwordRequired": "Please enter your password"
  }
}
```

- [ ] **Step 6: Create en_US/dashboard.json**

```json
{
  "greeting": {
    "morning": "Good morning, {{name}}",
    "subtitle": "Here is your business overview"
  },
  "stats": {
    "activeUsers": "Active Users",
    "partners": "Partners",
    "monthlyOrders": "Monthly Orders",
    "revenue": "Revenue (K)",
    "vsLastMonth": "vs Last Month"
  },
  "chart": {
    "monthlyTrend": "Monthly Trend",
    "month": "mo"
  },
  "activity": {
    "recent": "Recent Activity",
    "orderCreated": "{{name}} created new order #{{id}}",
    "partnerUpdated": "{{name}} updated partner information",
    "reportSubmitted": "{{name}} submitted monthly report",
    "backupCompleted": "System completed data backup"
  },
  "actions": {
    "createOrder": "New Order",
    "addPartner": "Add Partner",
    "reports": "Reports",
    "settings": "Settings",
    "import": "Import Data"
  }
}
```

- [ ] **Step 7: Verify files exist**

Run:
```bash
ls packages/admin/src/locales/zh_CN/ packages/admin/src/locales/en_US/
```

Expected: all 6 files listed.

- [ ] **Step 8: Commit**

```bash
git add packages/admin/src/locales/
git commit -m "feat: add locale JSON files for zh_CN and en_US"
```

---

### Task 3: Create i18n.ts and integrate with main.tsx

**Files:**
- Create: `packages/admin/src/i18n.ts`
- Modify: `packages/admin/src/main.tsx`

- [ ] **Step 1: Create i18n.ts**

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';

import commonZhCN from './locales/zh_CN/common.json';
import authZhCN from './locales/zh_CN/auth.json';
import dashboardZhCN from './locales/zh_CN/dashboard.json';
import commonEnUS from './locales/en_US/common.json';
import authEnUS from './locales/en_US/auth.json';
import dashboardEnUS from './locales/en_US/dashboard.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh_CN: {
        common: commonZhCN,
        auth: authZhCN,
        dashboard: dashboardZhCN,
      },
      en_US: {
        common: commonEnUS,
        auth: authEnUS,
        dashboard: dashboardEnUS,
      },
    },
    fallbackLng: 'en_US',
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'erp_lang',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

const antdLocales: Record<string, typeof zhCN> = {
  zh_CN: zhCN,
  en_US: enUS,
};

export function getAntdLocale() {
  return antdLocales[i18n.language] || enUS;
}

export default i18n;
```

- [ ] **Step 2: Update main.tsx to pass Ant Design locale**

Replace `packages/admin/src/main.tsx` content:

```tsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import App from './App';
import { useStore } from './store';
import i18n, { getAntdLocale } from './i18n';
import './index.css';

// Initialize auth before first render
useStore.getState().initializeAuth();

// Set document lang attribute on startup
document.documentElement.lang = i18n.language;

const themeConfig = {
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
};

function Root() {
  const [locale, setLocale] = useState(getAntdLocale());

  i18n.on('languageChanged', () => {
    setLocale(getAntdLocale());
    document.documentElement.lang = i18n.language;
  });

  return (
    <ConfigProvider locale={locale} theme={themeConfig}>
      <App />
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
```

- [ ] **Step 3: Type-check the admin package**

Run:
```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add packages/admin/src/i18n.ts packages/admin/src/main.tsx
git commit -m "feat: initialize i18next and wire Ant Design locale into ConfigProvider"
```

---

### Task 4: Add language switcher to AppHeader

**Files:**
- Modify: `packages/admin/src/components/AppHeader.tsx`

- [ ] **Step 1: Update AppHeader.tsx**

Replace `packages/admin/src/components/AppHeader.tsx` content:

```tsx
import React from 'react';
import { Layout, Button, Dropdown, Space } from 'antd';
import type { MenuProps } from 'antd';
import {
  BellOutlined,
  LogoutOutlined,
  ProfileOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useStore } from '../store';
import i18n from '../i18n';

const { Header } = Layout;

const langItems: MenuProps['items'] = [
  { key: 'zh_CN', label: '中文' },
  { key: 'en_US', label: 'English' },
];

function changeLanguage(key: string) {
  i18n.changeLanguage(key);
  localStorage.setItem('erp_lang', key);
}

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

      {/* Right: lang + notification + user pill */}
      <div className="flex items-center gap-3">
        <Dropdown
          menu={{
            items: langItems,
            onClick: ({ key }) => changeLanguage(key),
          }}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<GlobalOutlined style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }} />}
            className="erp-header-notify-btn"
          >
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginLeft: 4 }}>
              {i18n.language === 'zh_CN' ? '中文' : 'English'}
            </span>
          </Button>
        </Dropdown>

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

- [ ] **Step 2: Type-check**

Run:
```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/components/AppHeader.tsx
git commit -m "feat: add language switcher dropdown to AppHeader"
```

---

### Task 5: Refactor LoginPage to use translations

**Files:**
- Modify: `packages/admin/src/components/LoginPage.tsx`

- [ ] **Step 1: Update LoginPage.tsx**

Replace `packages/admin/src/components/LoginPage.tsx` content:

```tsx
import React, { useState } from 'react';
import { Input, Button, Form } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';

const LoginPage: React.FC = () => {
  const { t } = useTranslation('auth');
  const login = useStore((s) => s.login);
  const setAuthView = useStore((s) => s.setAuthView);
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
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
      <Brand />

      {/* Login card */}
      <motion.div
        className="erp-login-card"
        initial={{ opacity: 0, y: 24 }}
        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : { opacity: 1, y: 0 }}
        transition={shake
          ? { duration: 0.4 }
          : { duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <h2 className="erp-login-title">{t('login.title')}</h2>
        <p className="erp-login-subtitle">{t('login.subtitle')}</p>

        <Form onFinish={handleSubmit} layout="vertical" size="large">
          <Form.Item
            name="login"
            rules={[{ required: true, message: t('login.usernameRequired') }]}
          >
            <Input
              prefix={<UserOutlined className="text-[#bfbfbf]" />}
              placeholder={t('login.usernamePlaceholder')}
              autoComplete="username"
              className="erp-login-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('login.passwordRequired') }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-[#bfbfbf]" />}
              placeholder={t('login.passwordPlaceholder')}
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
              {t('login.submit')}
            </Button>
          </Form.Item>

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
        </Form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
```

Note: `Brand` is extracted as a shared component. We'll create it in this task.

- [ ] **Step 2: Create shared Brand component**

Create `packages/admin/src/components/Brand.tsx`:

```tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

export const Brand: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <div className="erp-login-brand">
      <div className="erp-login-brand-icon">A</div>
      <div>
        <div className="erp-login-brand-name">Agent ERP</div>
        <div className="erp-login-brand-sub">{t('brand.subtitle')}</div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Type-check**

Run:
```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add packages/admin/src/components/LoginPage.tsx packages/admin/src/components/Brand.tsx
git commit -m "feat: refactor LoginPage to use i18n translations, extract shared Brand component"
```

---

### Task 6: Refactor RegisterPage and ForgotPasswordPage to use translations

**Files:**
- Modify: `packages/admin/src/components/RegisterPage.tsx`
- Modify: `packages/admin/src/components/ForgotPasswordPage.tsx`

- [ ] **Step 1: Update RegisterPage.tsx**

Only change: replace the inline brand block with `<Brand />`, and add the import. Replace lines 62-68:

```
      <div className="erp-login-brand">
        <div className="erp-login-brand-icon">A</div>
        <div>
          <div className="erp-login-brand-name">Agent ERP</div>
          <div className="erp-login-brand-sub">智能企业管理平台</div>
        </div>
      </div>
```

with:

```
      <Brand />
```

Add import at top: `import { Brand } from './Brand';`

- [ ] **Step 2: Update ForgotPasswordPage.tsx**

Same change: replace the inline brand block (lines 79-85) with `<Brand />`. Add import at top: `import { Brand } from './Brand';`

- [ ] **Step 3: Type-check**

Run:
```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add packages/admin/src/components/RegisterPage.tsx packages/admin/src/components/ForgotPasswordPage.tsx
git commit -m "feat: replace hardcoded brand subtitle with shared Brand component"
```

---

### Task 7: Refactor App.tsx dashboard to use translations

**Files:**
- Modify: `packages/admin/src/App.tsx`

- [ ] **Step 1: Update App.tsx WelcomeScreen to use t()**

Replace the `WelcomeScreen` component in `packages/admin/src/App.tsx`.

Add import at top: `import { useTranslation } from 'react-i18next';`

Replace the entire `WelcomeScreen` component (lines 72-189) and associated constants (lines 48-70) with:

```tsx
const WelcomeScreen: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const user = useStore((s) => s.user);
  const menuItems = useStore((s) => s.menuItems);
  const setActiveMenu = useStore((s) => s.setActiveMenu);

  const greeting = t('greeting.morning', { name: user?.name ?? 'Guest' });

  const statCards = [
    { label: t('stats.activeUsers'), value: '1,248', change: '+12%', gradient: 'erp-stat-blue' },
    { label: t('stats.partners'), value: '356', change: '+8%', gradient: 'erp-stat-green' },
    { label: t('stats.monthlyOrders'), value: '89', change: '+23%', gradient: 'erp-stat-gold' },
    { label: t('stats.revenue'), value: '¥482', change: '+18%', gradient: 'erp-stat-purple' },
  ];

  const quickActions = [
    { label: t('actions.createOrder'), primary: true },
    { label: t('actions.addPartner'), primary: false },
    { label: t('actions.reports'), primary: false },
    { label: t('actions.settings'), primary: false },
    { label: t('actions.import'), primary: false },
  ];

  const mockBars = [45, 70, 55, 85, 60, 90, 75, 95, 65, 80, 70, 88];

  const mockActivities = [
    { color: '#1890ff', text: t('activity.orderCreated', { name: '张三', id: '1024' }) },
    { color: '#52c41a', text: t('activity.partnerUpdated', { name: '李四' }) },
    { color: '#faad14', text: t('activity.reportSubmitted', { name: '王五' }) },
    { color: '#722ed1', text: t('activity.backupCompleted') },
  ];

  return (
    <div className="erp-dashboard">
      <motion.div
        className="erp-dashboard-inner"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Greeting */}
        <motion.div variants={itemVariants} className="erp-dashboard-greeting">
          <h1 className="erp-dashboard-greeting-text">{greeting}</h1>
          <p className="erp-dashboard-greeting-sub">{t('greeting.subtitle')}</p>
        </motion.div>

        {/* Stats cards */}
        <motion.div variants={itemVariants} className="erp-dashboard-stats">
          {statCards.map((card) => (
            <motion.div
              key={card.label}
              variants={cardVariants}
              className={`erp-stat-card ${card.gradient}`}
            >
              <div className="erp-stat-label">{card.label}</div>
              <div className="erp-stat-value">{card.value}</div>
              <div className="erp-stat-change">
                {card.change}{' '}{t('stats.vsLastMonth')}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Content row: chart + recent */}
        <motion.div variants={itemVariants} className="erp-dashboard-content">
          {/* Main chart */}
          <div className="erp-dashboard-chart">
            <div className="erp-card-header">{t('chart.monthlyTrend')}</div>
            <div className="erp-chart-bars">
              {mockBars.map((h, i) => (
                <div key={i} className="erp-chart-bar-col">
                  <div
                    className="erp-chart-bar"
                    style={{ height: `${h}%` }}
                  />
                  <span className="erp-chart-label">
                    {i + 1}{t('chart.month')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="erp-dashboard-recent">
            <div className="erp-card-header">{t('activity.recent')}</div>
            <div className="erp-recent-list">
              {mockActivities.map((item, i) => (
                <div key={i} className="erp-recent-item">
                  <div
                    className="erp-recent-dot"
                    style={{ background: item.color }}
                  />
                  <span className="erp-recent-text">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div variants={itemVariants} className="erp-dashboard-actions">
          {quickActions.map((action) => (
            <button
              type="button"
              key={action.label}
              className={
                action.primary
                  ? 'erp-action-pill erp-action-pill-primary'
                  : 'erp-action-pill'
              }
            >
              {action.primary && <span className="erp-action-plus">+</span>}
              {action.label}
            </button>
          ))}
        </motion.div>

        {/* Module chips */}
        {menuItems.length > 0 && (
          <motion.div variants={itemVariants} className="flex flex-wrap gap-2.5">
            {menuItems
              .filter((m) => !m.parentId)
              .sort((a, b) => a.sequence - b.sequence)
              .slice(0, 6)
              .map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setActiveMenu(m.id)}
                  className="erp-module-chip"
                >
                  {m.name}
                </button>
              ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
```

Replace the "导航菜单" sidebar labels with `useTranslation('common').t('menu.navigation')`.

In the `App` component, add after `const App: React.FC = () => {`:

```tsx
const { t: tc } = useTranslation('common');
```

Replace the two `'导航菜单'` strings (lines 241 and 273) with `tc('menu.navigation')`.

- [ ] **Step 2: Move mock data inside the component**

The `statCards`, `quickActions`, `mockBars`, and `mockActivities` constants were defined at module level (lines 48-70). Since they now depend on `t()`, they must be inside `WelcomeScreen`. Delete lines 48-70 (empty lines where the constants were).

- [ ] **Step 3: Type-check**

Run:
```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add packages/admin/src/App.tsx
git commit -m "feat: refactor dashboard WelcomeScreen to use i18n translations"
```

---

### Task 8: Create backend i18n in @erp/core

**Files:**
- Create: `packages/core/src/i18n/index.ts`
- Create: `packages/core/src/i18n/__tests__/i18n.test.ts`

- [ ] **Step 1: Create backend i18n module**

Create `packages/core/src/i18n/index.ts`:

```ts
import i18n from 'i18next';

const errorResources = {
  zh_CN: {
    errors: {
      auth: {
        invalid_credentials: '用户名或密码错误',
        login_password_required: '请输入用户名和密码',
        password_too_short: '密码长度不能少于6位',
        user_exists: '该用户名已存在',
        email_exists: '该邮箱已被注册',
        user_id_code_required: '用户ID和验证码为必填项',
        invalid_code: '验证码无效或已过期',
        email_required: '邮箱为必填项',
        user_id_code_password_required: '用户ID、验证码和新密码为必填项',
        invalid_reset_code: '重置码无效或已过期',
        name_login_password_email_required: '姓名、用户名、密码和邮箱为必填项',
      },
      validation: {
        required: '{{field}} 为必填项',
      },
    },
  },
  en_US: {
    errors: {
      auth: {
        invalid_credentials: 'Invalid username or password',
        login_password_required: 'Login and password are required',
        password_too_short: 'Password must be at least 6 characters',
        user_exists: 'A user with this login already exists',
        email_exists: 'A user with this email already exists',
        user_id_code_required: 'User ID and code are required',
        invalid_code: 'Invalid or expired verification code',
        email_required: 'Email is required',
        user_id_code_password_required: 'User ID, code, and new password are required',
        invalid_reset_code: 'Invalid or expired reset code',
        name_login_password_email_required: 'Name, login, password, and email are required',
      },
      validation: {
        required: '{{field}} is required',
      },
    },
  },
};

i18n.init({
  resources: errorResources,
  fallbackLng: 'en_US',
  defaultNS: 'errors',
  interpolation: { escapeValue: false },
});

export function getRequestLocale(langHeader?: string): string {
  if (!langHeader) return 'en_US';

  const locales = langHeader
    .split(',')
    .map((entry) => {
      const [tag, qRaw] = entry.trim().split(';');
      const q = qRaw ? parseFloat(qRaw.split('=')[1] ?? '1') : 1;
      return { tag: tag.trim(), q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of locales) {
    if (tag === 'zh-CN' || tag === 'zh') return 'zh_CN';
    if (tag.startsWith('zh')) return 'zh_CN';
    if (tag === 'en-US' || tag === 'en') return 'en_US';
    if (tag.startsWith('en')) return 'en_US';
  }

  return 'en_US';
}

export function tError(lang: string, key: string, params?: Record<string, unknown>): string {
  return i18n.getFixedT(lang)(key, params);
}

export default i18n;
```

- [ ] **Step 2: Create unit test**

Create `packages/core/src/i18n/__tests__/i18n.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getRequestLocale, tError } from '../index';

describe('getRequestLocale', () => {
  it('returns en_US when header is undefined', () => {
    expect(getRequestLocale()).toBe('en_US');
  });

  it('returns en_US when header is empty', () => {
    expect(getRequestLocale('')).toBe('en_US');
  });

  it('parses zh-CN correctly', () => {
    expect(getRequestLocale('zh-CN')).toBe('zh_CN');
  });

  it('parses en-US correctly', () => {
    expect(getRequestLocale('en-US')).toBe('en_US');
  });

  it('parses simple "zh" tag', () => {
    expect(getRequestLocale('zh')).toBe('zh_CN');
  });

  it('parses simple "en" tag', () => {
    expect(getRequestLocale('en')).toBe('en_US');
  });

  it('respects quality values in Accept-Language', () => {
    const header = 'zh-CN,zh;q=0.9,en;q=0.8';
    expect(getRequestLocale(header)).toBe('zh_CN');
  });

  it('falls back to en_US for unknown languages', () => {
    expect(getRequestLocale('fr-FR')).toBe('en_US');
  });
});

describe('tError', () => {
  it('translates error message in zh_CN', () => {
    const result = tError('zh_CN', 'errors:auth.invalid_credentials');
    expect(result).toBe('用户名或密码错误');
  });

  it('translates error message in en_US', () => {
    const result = tError('en_US', 'errors:auth.invalid_credentials');
    expect(result).toBe('Invalid username or password');
  });

  it('falls back to en_US for unmapped language', () => {
    const result = tError('fr_FR', 'errors:auth.invalid_credentials');
    expect(result).toBe('Invalid username or password');
  });

  it('supports interpolation params', () => {
    const result = tError('zh_CN', 'errors:validation.required', { field: '邮箱' });
    expect(result).toBe('邮箱 为必填项');
  });
});
```

- [ ] **Step 3: Run tests**

Run:
```bash
pnpm --filter @erp/core test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/i18n/ packages/core/src/i18n/__tests__/
git commit -m "feat: add backend i18n module with Accept-Language parsing and error translation"
```

---

### Task 9: Update vite.config.ts to extract locale and pass errors

**Files:**
- Modify: `packages/admin/vite.config.ts`

- [ ] **Step 1: Update the Vite plugin to pass locale and error messages**

In `packages/admin/vite.config.ts`, the handler catch block currently swallows the real error message:

```ts
} catch (handlerErr) {
  console.error('[erp] handler error:', handlerErr);
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Internal server error' }));
}
```

Update the route handler section. After `const ctrl = new Ctrl();`, add locale extraction. Replace the try/catch block around the handler call (lines 153-161) with:

```ts
                const locale = getRequestLocale(req.headers['accept-language']);
                const ctx = { uid, params: match.params, body, locale };
                try {
                  const result = await ctrl[route.handler](ctx);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(result ?? {}));
                } catch (handlerErr) {
                  console.error('[erp] handler error:', handlerErr);
                  const message = handlerErr instanceof Error ? handlerErr.message : 'Internal server error';
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: message }));
                }
```

Add the import for `getRequestLocale` to the dynamic imports inside the middleware. Add after `const { verifyToken } = await server.ssrLoadModule('@erp/core');`:

```ts
          const { getRequestLocale } = await server.ssrLoadModule('@erp/core');
```

Wait, this creates two separate `await server.ssrLoadModule('@erp/core')` calls. Let me consolidate.

Replace:
```ts
          const { verifyToken } = await server.ssrLoadModule('@erp/core');
          const { getModuleRegistry } = await server.ssrLoadModule('@erp/core');
```

with:
```ts
          const { verifyToken, getModuleRegistry, getRequestLocale } = await server.ssrLoadModule('@erp/core');
```

- [ ] **Step 2: Verify vite.config.ts builds**

Run:
```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add packages/admin/vite.config.ts
git commit -m "feat: extract Accept-Language locale in Vite middleware, pass real error messages"
```

---

### Task 10: Update auth_controller to use i18n error messages

**Files:**
- Modify: `modules/base/controllers/auth_controller.ts`

- [ ] **Step 1: Update auth_controller.ts**

Replace `modules/base/controllers/auth_controller.ts` content:

```ts
import { env } from '@erp/domain';
import { hashPassword, verifyPassword, signToken, storeCode, verifyCode, tError } from '@erp/core';
import { getKnex } from '@erp/data';

export class AuthController {
  static routes = [
    { path: '/api/auth/login', method: 'POST' as const, handler: 'login', auth: false },
    { path: '/api/auth/register', method: 'POST' as const, handler: 'register', auth: false },
    { path: '/api/auth/verify-registration', method: 'POST' as const, handler: 'verifyRegistration', auth: false },
    { path: '/api/auth/forgot-password', method: 'POST' as const, handler: 'forgotPassword', auth: false },
    { path: '/api/auth/reset-password', method: 'POST' as const, handler: 'resetPassword', auth: false },
  ];

  async login(ctx: { body: Record<string, unknown>; locale?: string }) {
    const { login, password } = ctx.body;
    const lang = ctx.locale ?? 'en_US';

    if (!login || !password) {
      throw new Error(tError(lang, 'errors:auth.login_password_required'));
    }

    const knex = getKnex();
    const user = await knex('res_users')
      .where({ login: login as string, active: true })
      .first();

    if (!user) {
      throw new Error(tError(lang, 'errors:auth.invalid_credentials'));
    }

    const valid = await verifyPassword(password as string, user.password);
    if (!valid) {
      throw new Error(tError(lang, 'errors:auth.invalid_credentials'));
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

  async register(ctx: { body: Record<string, unknown>; locale?: string }) {
    const { name, login, password, email } = ctx.body;
    const lang = ctx.locale ?? 'en_US';

    if (!name || !login || !password || !email) {
      throw new Error(tError(lang, 'errors:auth.name_login_password_email_required'));
    }

    if (typeof password === 'string' && password.length < 6) {
      throw new Error(tError(lang, 'errors:auth.password_too_short'));
    }

    const knex = getKnex();

    const existingLogin = await knex('res_users')
      .where({ login: login as string })
      .first();
    if (existingLogin) {
      throw new Error(tError(lang, 'errors:auth.user_exists'));
    }

    const existingEmail = await knex('res_users')
      .where({ email: email as string })
      .first();
    if (existingEmail) {
      throw new Error(tError(lang, 'errors:auth.email_exists'));
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

    console.log(`[DEV] Verification code for ${login}: ${code}`);

    return {
      userId: (created as Record<string, unknown>).id,
      message: 'Registration successful. Please verify your email.',
    };
  }

  async verifyRegistration(ctx: { body: Record<string, unknown>; locale?: string }) {
    const { userId, code } = ctx.body;
    const lang = ctx.locale ?? 'en_US';

    if (!userId || !code) {
      throw new Error(tError(lang, 'errors:auth.user_id_code_required'));
    }

    const knex = getKnex();
    const valid = await verifyCode(knex, userId as number, code as string, 'register');

    if (!valid) {
      throw new Error(tError(lang, 'errors:auth.invalid_code'));
    }

    await env('res.users').write([userId as number], { active: true });

    return { message: 'Account activated. You can now log in.' };
  }

  async forgotPassword(ctx: { body: Record<string, unknown>; locale?: string }) {
    const { email } = ctx.body;
    const lang = ctx.locale ?? 'en_US';

    if (!email) {
      throw new Error(tError(lang, 'errors:auth.email_required'));
    }

    const knex = getKnex();
    const user = await knex('res_users')
      .where({ email: email as string })
      .first();

    if (!user) {
      return { message: 'If the email exists, a reset code has been sent.' };
    }

    const code = await storeCode(knex, user.id, 'reset');

    console.log(`[DEV] Password reset for user ID ${user.id} (${user.login}): code ${code}`);

    return { message: 'If the email exists, a reset code has been sent.' };
  }

  async resetPassword(ctx: { body: Record<string, unknown>; locale?: string }) {
    const { userId, code, password } = ctx.body;
    const lang = ctx.locale ?? 'en_US';

    if (!userId || !code || !password) {
      throw new Error(tError(lang, 'errors:auth.user_id_code_password_required'));
    }

    if (typeof password === 'string' && password.length < 6) {
      throw new Error(tError(lang, 'errors:auth.password_too_short'));
    }

    const knex = getKnex();
    const valid = await verifyCode(knex, userId as number, code as string, 'reset');

    if (!valid) {
      throw new Error(tError(lang, 'errors:auth.invalid_reset_code'));
    }

    const hashed = await hashPassword(password as string);
    await env('res.users').write([userId as number], { password: hashed });

    return { message: 'Password has been reset. You can now log in.' };
  }
}
```

Note: The `ctx` parameter type now includes `locale?: string` because the Vite middleware injects it.

- [ ] **Step 2: Update @erp/core index.ts to export tError**

Edit `packages/core/src/index.ts` — add the export line:

```ts
export { getRequestLocale, tError } from './i18n';
```

(Check if `index.ts` already has exports.)

- [ ] **Step 3: Type-check**

Run:
```bash
pnpm --filter @erp/admin exec tsc --noEmit
pnpm --filter @erp/core exec tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add modules/base/controllers/auth_controller.ts packages/core/src/index.ts
git commit -m "feat: use i18n error messages in auth controller with locale from request"
```

---

### Task 11: Create erp_translations migration table

**Files:**
- Modify: `modules/base/data/seed.ts` (or create a migration step)

- [ ] **Step 1: Add erp_translations table creation to seed**

Read `modules/base/data/seed.ts` first to understand the existing pattern.

- [ ] **Step 2: Add the CREATE TABLE IF NOT EXISTS statement**

Add to the seed file's existing table creation block:

```sql
CREATE TABLE IF NOT EXISTS erp_translations (
  id SERIAL PRIMARY KEY,
  module VARCHAR(64),
  resource_type VARCHAR(32),
  resource_id VARCHAR(128),
  lang VARCHAR(10),
  value TEXT NOT NULL,
  UNIQUE(module, resource_type, resource_id, lang)
);
```

- [ ] **Step 3: Commit**

```bash
git add modules/base/data/seed.ts
git commit -m "feat: add erp_translations table for future business module translations"
```

---

### Task 12: End-to-end verification

- [ ] **Step 1: Start the dev server**

Run:
```bash
pnpm --filter @erp/admin dev
```

- [ ] **Step 2: Verify login page renders in Chinese**

Open `http://localhost:3000` in a browser. The login page should show Chinese text if browser language is detected as Chinese, or after clicking the language switcher.

- [ ] **Step 3: Verify language switcher works**

Click the language dropdown in the header → select "English" → page should switch to English. Click "中文" → page should switch back.

- [ ] **Step 4: Verify dashboard translations**

Log in and verify the dashboard welcome screen shows translated text.

- [ ] **Step 5: Verify Ant Design locale**

Check that Ant Design components (e.g., pagination if visible, or form validation messages) use the correct locale.

- [ ] **Step 6: Run all existing tests**

Run:
```bash
pnpm test
```

Expected: all existing tests pass.

- [ ] **Step 7: Run e2e tests if present**

Run:
```bash
npx playwright test --config=packages/admin/playwright.config.ts
```

- [ ] **Step 8: Commit any final adjustments**

```bash
git add -A
git commit -m "chore: final i18n integration adjustments"
```
