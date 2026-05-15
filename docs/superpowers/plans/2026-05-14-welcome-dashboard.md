# Welcome Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic welcome screen with a data dashboard showing stats cards, a chart, recent activity, and quick actions.

**Architecture:** Single-component replacement — `WelcomeScreen` in `App.tsx` rewritten as a dashboard with gradient stat cards, bar chart area, recent activity list, and pill-shaped quick actions. All styles in `index.css`. No new files, no backend.

**Tech Stack:** React 18, Ant Design 5, Tailwind CSS 3, framer-motion

---

### Task 1: Replace WelcomeScreen component

**Files:**
- Modify: `packages/admin/src/App.tsx:22-155`

- [ ] **Step 1: Replace WelcomeScreen and related code**

Replace lines 22-155 in `App.tsx` — the animation variants, `quickActions` array, and the entire `WelcomeScreen` component.

First, remove lines 22-46 (animation variants, `quickActions` array). Then replace lines 48-155 (the `WelcomeScreen` component).

New code to insert after line 21 (`const { useBreakpoint } = Grid;`):

```typescript
/* ── Staggered animation variants ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const easeOut = [0.4, 0, 0.2, 1] as const;

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: easeOut },
  },
};

const statCards = [
  { label: '活跃用户', value: '1,248', change: '+12%', gradient: 'erp-stat-blue' },
  { label: '合作伙伴', value: '356', change: '+8%', gradient: 'erp-stat-green' },
  { label: '本月订单', value: '89', change: '+23%', gradient: 'erp-stat-gold' },
  { label: '营收 (K)', value: '¥482', change: '+18%', gradient: 'erp-stat-purple' },
];

const quickActions = [
  { label: '新建订单', primary: true },
  { label: '添加伙伴', primary: false },
  { label: '报表中心', primary: false },
  { label: '系统设置', primary: false },
  { label: '导入数据', primary: false },
];

const mockBars = [45, 70, 55, 85, 60, 90, 75, 95, 65, 80, 70, 88];

const mockActivities = [
  { color: '#1890ff', text: '张三 创建了新订单 #1024' },
  { color: '#52c41a', text: '李四 更新了合作伙伴信息' },
  { color: '#faad14', text: '王五 提交了月度报表' },
  { color: '#722ed1', text: '系统 完成了数据备份' },
];

const WelcomeScreen: React.FC = () => {
  const user = useStore((s) => s.user);
  const menuItems = useStore((s) => s.menuItems);
  const setActiveMenu = useStore((s) => s.setActiveMenu);

  const greeting = `早上好, ${user?.name ?? 'Guest'}`;

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
          <p className="erp-dashboard-greeting-sub">以下是您的业务概览</p>
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
              <div className="erp-stat-change">{card.change} vs 上月</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Content row: chart + recent */}
        <motion.div variants={itemVariants} className="erp-dashboard-content">
          {/* Main chart */}
          <div className="erp-dashboard-chart">
            <div className="erp-card-header">月度趋势</div>
            <div className="erp-chart-bars">
              {mockBars.map((h, i) => (
                <div key={i} className="erp-chart-bar-col">
                  <div
                    className="erp-chart-bar"
                    style={{ height: `${h}%` }}
                  />
                  <span className="erp-chart-label">{i + 1}月</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="erp-dashboard-recent">
            <div className="erp-card-header">最近动态</div>
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

        {/* Module chips — keep existing behavior */}
        {menuItems.length > 0 && (
          <motion.div variants={itemVariants} className="flex flex-wrap gap-2.5">
            {menuItems
              .filter((m) => !m.parentId)
              .sort((a, b) => a.sequence - b.sequence)
              .slice(0, 6)
              .map((m) => (
                <button
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

Also remove the unused icon imports from line 3-9. Replace:

```typescript
import {
  AppstoreOutlined,
  ProfileOutlined,
  SearchOutlined,
  TableOutlined,
  SettingOutlined,
} from '@ant-design/icons';
```

With just the icons still used elsewhere in the file (check the `quickActions` array previously defined at lines 41-46 — if removed, `ProfileOutlined`, `SearchOutlined`, `TableOutlined` are no longer needed). Keep `SettingOutlined` only if it's used in the sidebar user presence area (it is, at line ~185).

The import block should become:

```typescript
import { SettingOutlined } from '@ant-design/icons';
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/App.tsx
git commit -m "feat: replace welcome screen with data dashboard (stats, chart, activity, actions)"
```

---

### Task 2: Replace welcome CSS with dashboard styles

**Files:**
- Modify: `packages/admin/src/index.css` — replace `.erp-welcome*` styles (lines 240-364)

- [ ] **Step 1: Remove old welcome styles, add dashboard styles**

Remove lines 240-364 from `index.css` (the blocks starting with `/* ── Welcome screen ── */` through the `.erp-decorative-dot` styles).

Then remove the `.erp-module-chip` block (old lines 343-364) and replace with just module chip + dashboard styles.

Actually, keep `.erp-module-chip` since it's still used by the module chips in the new dashboard. Just remove the welcome-specific styles and decorative elements.

Find and remove these blocks:
- `/* ── Welcome screen ── */` through `.erp-decorative-dot` (lines 240-306 approximately)
- `.erp-welcome-card` through its `::after` block (lines 308-337 approximately)
- `.erp-welcome-card-icon` hover (lines 338-341)

Then append the new dashboard styles at the end of the file:

```css
/* ── Dashboard ── */
.erp-dashboard {
  min-height: 100%;
  padding: 32px 36px 48px;
  overflow-y: auto;
}

.erp-dashboard-inner {
  max-width: 1100px;
  margin: 0 auto;
}

/* Greeting */
.erp-dashboard-greeting {
  margin-bottom: 28px;
}
.erp-dashboard-greeting-text {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}
.erp-dashboard-greeting-sub {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
}

/* Stats cards */
.erp-dashboard-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}
.erp-stat-card {
  border-radius: 12px;
  padding: 20px 18px;
  color: white;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.erp-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 22px rgba(0,0,0,0.18);
}
.erp-stat-blue {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  box-shadow: 0 4px 16px rgba(24,144,255,0.3);
}
.erp-stat-green {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  box-shadow: 0 4px 16px rgba(82,196,26,0.3);
}
.erp-stat-gold {
  background: linear-gradient(135deg, #faad14, #ffc53d);
  box-shadow: 0 4px 16px rgba(250,173,20,0.3);
}
.erp-stat-purple {
  background: linear-gradient(135deg, #722ed1, #9254de);
  box-shadow: 0 4px 16px rgba(114,46,209,0.3);
}
.erp-stat-label {
  font-size: 11px;
  opacity: 0.75;
  font-family: var(--font-body);
  font-weight: 500;
  margin-bottom: 6px;
}
.erp-stat-value {
  font-size: 28px;
  font-weight: 700;
  font-family: var(--font-display);
  margin-bottom: 4px;
}
.erp-stat-change {
  font-size: 10px;
  opacity: 0.7;
  font-family: var(--font-body);
}

/* Content row */
.erp-dashboard-content {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 14px;
  margin-bottom: 24px;
}
.erp-card-header {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 14px;
}

/* Chart */
.erp-dashboard-chart {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 22px 20px;
}
.erp-chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 140px;
}
.erp-chart-bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}
.erp-chart-bar {
  width: 100%;
  max-width: 36px;
  background: linear-gradient(to top, #1890ff, #69b1ff);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.4s ease;
}
.erp-chart-label {
  font-size: 10px;
  color: var(--color-text-muted);
  margin-top: 6px;
  font-family: var(--font-body);
}

/* Recent activity */
.erp-dashboard-recent {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 22px 20px;
}
.erp-recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.erp-recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.erp-recent-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.erp-recent-text {
  font-size: 12px;
  color: var(--color-text-muted);
  font-family: var(--font-body);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Quick action pills */
.erp-dashboard-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
}
.erp-action-pill {
  padding: 8px 20px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-body);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
}
.erp-action-pill:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(24,144,255,0.1);
}
.erp-action-pill-primary {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}
.erp-action-pill-primary:hover {
  background: #40a9ff;
  border-color: #40a9ff;
  color: white;
  box-shadow: 0 2px 12px rgba(24,144,255,0.3);
}
.erp-action-plus {
  margin-right: 4px;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .erp-dashboard {
    padding: 20px 16px 32px;
  }
  .erp-dashboard-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .erp-dashboard-content {
    grid-template-columns: 1fr;
  }
  .erp-chart-bars {
    height: 100px;
    gap: 8px;
  }
  .erp-dashboard-greeting-text {
    font-size: 22px;
  }
}
@media (max-width: 480px) {
  .erp-dashboard-stats {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Verify the build**

```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/index.css
git commit -m "feat: add dashboard styles — stat cards, chart, activity, action pills"
```

---

### Task 3: E2E test update

**Files:**
- Modify: `packages/admin/e2e/login.spec.ts`
- Create: `packages/admin/e2e/dashboard.spec.ts`

- [ ] **Step 1: Create dashboard e2e test**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('shows greeting after login', async ({ page }) => {
    // Requires a logged-in session — test presence of dashboard container
    // This test is a placeholder until login test setup with real users exists
    test.skip();
  });

  test('renders stat cards', async ({ page }) => {
    test.skip();
  });

  test('renders quick action pills', async ({ page }) => {
    test.skip();
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add packages/admin/e2e/dashboard.spec.ts
git commit -m "test: add dashboard e2e test placeholder"
```

---

### Task 4: Final verification

- [ ] **Step 1: Build check**

```bash
pnpm build
```

Expected: all packages compile.

- [ ] **Step 2: Run all tests**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 3: Start dev server and verify visually**

```bash
pnpm --filter @erp/admin dev
```

Open http://localhost:3000. After login, verify:
- Greeting shows "早上好, [name]"
- 4 gradient stat cards in a row with values and change indicators
- Bar chart (12 bars) and recent activity list side by side
- Quick action pills at bottom, first one brand-colored
- Module chips below if menu items loaded
- Responsive: resize to mobile, stats stack 2-col then 1-col

- [ ] **Step 4: Commit any remaining changes**

```bash
git status
git add <remaining files>
git commit -m "chore: final dashboard verification tweaks"
```
