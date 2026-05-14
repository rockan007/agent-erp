# Admin Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade admin shell from basic antd Layout to a professional management console with top header bar, collapsible dark sidebar, responsive breakpoints, page transitions, and e2e test coverage.

**Architecture:** Add `AppHeader` (brand + collapse + breadcrumb + user dropdown) and `PageHeader` (view title + actions) components atop the existing rendering tree. Darken the sidebar via antd `theme="dark"`. Wrap ViewRenderer content in framer-motion `<AnimatePresence>` for 150ms fade transitions. Mobile: sidebar becomes antd `<Drawer>` overlay.

**Tech Stack:** React 18, TypeScript 5, Ant Design 5 (Layout, Menu dark, Breadcrumb, Dropdown, Drawer), Tailwind CSS 3, framer-motion, Zustand (store additions), Playwright (e2e).

**Design Spec:** `docs/superpowers/specs/2026-05-15-admin-layout-redesign.md`

---

## File Map (changes)

```
packages/admin/
├── package.json                          # +framer-motion
├── src/
│   ├── types.ts                          # +BreadcrumbItem, +siderCollapsed/breadcrumbs in AppState
│   ├── store.ts                          # +setSiderCollapsed, +setBreadcrumbs, +breadcrumb compute
│   ├── App.tsx                           # Restructure: Layout.Header + dark Sider + Drawer mobile
│   └── components/
│       ├── AppHeader.tsx                 # NEW: logo + collapse + breadcrumb + user dropdown
│       ├── PageHeader.tsx               # NEW: view title + action buttons
│       ├── MenuRenderer.tsx              # Remove internal brand div; support dark; export findBreadcrumbs
│       ├── ViewRenderer.tsx             # Wrap content in AnimatePresence + motion.div
│       ├── FormRenderer.tsx             # Remove <Title>, add max-w-3xl mx-auto
│       ├── TableRenderer.tsx            # Remove <Title>, add scroll.x responsive
│       └── SearchPanel.tsx              # Remove <Title>, responsive layout="vertical" on mobile
├── e2e/
│   └── admin.spec.ts                    # +header, breadcrumb, collapsed, responsive tests
```

---

### Task 1: Update store + types

**Files:**
- Modify: `packages/admin/src/types.ts`
- Modify: `packages/admin/src/store.ts`

- [ ] **Step 1: Add new types to types.ts**

Add `BreadcrumbItem` and extend `AppState`:

```typescript
export interface BreadcrumbItem {
  id: string;
  name: string;
}

export interface AppState {
  menuItems: MenuItem[];
  activeMenuId: string | null;
  activeView: ViewSpec | null;
  user: { id: number; name: string; groups: string[] } | null;
  siderCollapsed: boolean;
  breadcrumbs: BreadcrumbItem[];

  setMenuItems: (items: MenuItem[]) => void;
  setActiveMenu: (id: string) => void;
  setActiveView: (view: ViewSpec | null) => void;
  setUser: (user: AppState['user']) => void;
  setSiderCollapsed: (collapsed: boolean) => void;
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
}
```

- [ ] **Step 2: Update store.ts with new state + compute helper**

```typescript
import { create } from 'zustand';
import type { MenuItem, ViewSpec, AppState, BreadcrumbItem } from './types';

export type { MenuItem, ViewSpec, ViewField, ViewLayout, ViewLayoutItem, BreadcrumbItem } from './types';

// Walk menu tree upward from activeMenuId to build breadcrumb path
export function computeBreadcrumbs(
  activeMenuId: string | null,
  menuItems: MenuItem[],
): BreadcrumbItem[] {
  if (!activeMenuId) return [];
  const path: BreadcrumbItem[] = [];
  let current: MenuItem | undefined = menuItems.find((m) => m.id === activeMenuId);
  while (current) {
    path.unshift({ id: current.id, name: current.name });
    current = current.parentId
      ? menuItems.find((m) => m.id === current!.parentId)
      : undefined;
  }
  return path;
}

export const useStore = create<AppState>((set) => ({
  menuItems: [],
  activeMenuId: null,
  activeView: null,
  user: null,
  siderCollapsed: false,
  breadcrumbs: [],

  setMenuItems: (items) => {
    const state = useStore.getState();
    set({
      menuItems: items,
      breadcrumbs: computeBreadcrumbs(state.activeMenuId, items),
    });
  },
  setActiveMenu: (id) => {
    const state = useStore.getState();
    set({
      activeMenuId: id,
      breadcrumbs: computeBreadcrumbs(id, state.menuItems),
    });
  },
  setActiveView: (view) => set({ activeView: view }),
  setUser: (user) => set({ user }),
  setSiderCollapsed: (collapsed) => set({ siderCollapsed: collapsed }),
  setBreadcrumbs: (items) => set({ breadcrumbs: items }),
}));

declare global {
  interface Window { __STORE__?: typeof useStore; }
}
if (typeof window !== 'undefined') {
  window.__STORE__ = useStore;
}
```

- [ ] **Step 3: Run type check**

Run: `pnpm --filter @erp/admin exec tsc --noEmit`
Expected: zero type errors.

- [ ] **Step 4: Commit**

```bash
git add packages/admin/src/types.ts packages/admin/src/store.ts
git commit -m "feat: add siderCollapsed, breadcrumbs state to admin store"
```

---

### Task 2: Install framer-motion

**Files:**
- Modify: `packages/admin/package.json`

- [ ] **Step 1: Add framer-motion dependency**

Run: `pnpm --filter @erp/admin add framer-motion`

- [ ] **Step 2: Commit**

```bash
git add packages/admin/package.json pnpm-lock.yaml
git commit -m "chore: add framer-motion for page transitions"
```

---

### Task 3: Create AppHeader component

**Files:**
- Create: `packages/admin/src/components/AppHeader.tsx`

- [ ] **Step 1: Write AppHeader.tsx**

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

const userMenuItems: MenuProps['items'] = [
  { key: 'profile', icon: <ProfileOutlined />, label: 'My Profile' },
  { type: 'divider' },
  { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
];

export const AppHeader: React.FC = () => {
  const siderCollapsed = useStore((s) => s.siderCollapsed);
  const setSiderCollapsed = useStore((s) => s.setSiderCollapsed);
  const breadcrumbs = useStore((s) => s.breadcrumbs);
  const user = useStore((s) => s.user);

  const breadcrumbItems = breadcrumbs.length > 0
    ? breadcrumbs.map((b) => ({ title: b.name }))
    : [{ title: 'Home' }];

  return (
    <Header className="flex items-center justify-between px-4 bg-white border-b border-gray-100 h-12 leading-[48px]">
      <div className="flex items-center gap-4">
        <Button
          type="text"
          icon={siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setSiderCollapsed(!siderCollapsed)}
        />
        <span className="text-base font-bold text-gray-800">Agent ERP</span>
        <Breadcrumb items={breadcrumbItems} className="ml-2" />
      </div>

      <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
        <Space className="cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
            <UserOutlined className="text-white text-xs" />
          </div>
          <span className="text-sm text-gray-600">
            {user?.name ?? 'Guest'}
          </span>
        </Space>
      </Dropdown>
    </Header>
  );
};
```

- [ ] **Step 2: Run type check**

Run: `pnpm --filter @erp/admin exec tsc --noEmit`
Expected: zero type errors.

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/components/AppHeader.tsx
git commit -m "feat: add AppHeader with collapse toggle, breadcrumb, user dropdown"
```

---

### Task 4: Create PageHeader component

**Files:**
- Create: `packages/admin/src/components/PageHeader.tsx`

- [ ] **Step 1: Write PageHeader.tsx**

```typescript
import React from 'react';
import { Typography, Space } from 'antd';
import { ViewSpec } from '../store';

const { Title } = Typography;

interface Props {
  view: ViewSpec;
}

export const PageHeader: React.FC<Props> = ({ view }) => {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white">
      <Title level={4} className="!mb-0">{view.title}</Title>
      <Space>
        {/* Action buttons extensible via ViewSpec.actions in future */}
      </Space>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/admin/src/components/PageHeader.tsx
git commit -m "feat: add PageHeader component for view title + actions"
```

---

### Task 5: Update MenuRenderer for dark theme + breadcrumb

**Files:**
- Modify: `packages/admin/src/components/MenuRenderer.tsx`

- [ ] **Step 1: Rewrite MenuRenderer — remove brand div, add dark support**

```typescript
import React from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useStore, MenuItem } from '../store';

const ICON_MAP: Record<string, React.ReactNode> = {
  contacts: <TeamOutlined />,
  partners: <TeamOutlined />,
  settings: <SettingOutlined />,
  users: <UserOutlined />,
  default: <AppstoreOutlined />,
};

function pickIcon(name: string): React.ReactNode {
  const key = name.toLowerCase();
  return ICON_MAP[key] ?? ICON_MAP.default!;
}

interface TreeNode {
  item: MenuItem;
  children: TreeNode[];
}

function buildTree(items: MenuItem[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const item of items) {
    map.set(item.id, { item, children: [] });
  }

  for (const item of items) {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortTree = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.item.sequence - b.item.sequence);
    for (const node of nodes) sortTree(node.children);
  };
  sortTree(roots);
  return roots;
}

function toAntdItems(nodes: TreeNode[]): MenuProps['items'] {
  return nodes.map((node) => {
    const hasChildren = node.children.length > 0;
    if (hasChildren) {
      return {
        key: node.item.id,
        label: node.item.name,
        icon: node.item.icon ?? pickIcon(node.item.name),
        children: toAntdItems(node.children),
      };
    }
    return {
      key: node.item.id,
      label: node.item.name,
      icon: node.item.icon ?? pickIcon(node.item.name),
    };
  });
}

interface Props {
  onItemClick?: () => void;
}

export const MenuRenderer: React.FC<Props> = ({ onItemClick }) => {
  const menuItems = useStore((s) => s.menuItems);
  const activeMenuId = useStore((s) => s.activeMenuId);
  const setActiveMenu = useStore((s) => s.setActiveMenu);
  const tree = buildTree(menuItems);
  const antdItems = toAntdItems(tree);

  const onClick: MenuProps['onClick'] = ({ key }) => {
    setActiveMenu(key);
    onItemClick?.();
  };

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={activeMenuId ? [activeMenuId] : []}
      items={antdItems}
      onClick={onClick}
    />
  );
};
```

Key changes from current:
- Added `Props` with optional `onItemClick` (for drawer close on mobile)
- Removed the brand div (branding moves to AppHeader)
- Menu `theme="dark"` for dark sidebar
- Removed `className="border-r-0"` (dark theme handles borders)

- [ ] **Step 2: Run type check**

Run: `pnpm --filter @erp/admin exec tsc --noEmit`
Expected: zero type errors.

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/components/MenuRenderer.tsx
git commit -m "feat: MenuRenderer dark theme support, remove internal brand div"
```

---

### Task 6: Restructure App.tsx — Header + Dark Sider + Drawer

**Files:**
- Modify: `packages/admin/src/App.tsx`

- [ ] **Step 1: Rewrite App.tsx with full layout restructure**

```typescript
import React from 'react';
import { Layout, Drawer, Grid } from 'antd';
import { AppHeader } from './components/AppHeader';
import { MenuRenderer } from './components/MenuRenderer';
import { ViewRenderer } from './components/ViewRenderer';
import { PageHeader } from './components/PageHeader';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useStore } from './store';

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const App: React.FC = () => {
  const activeView = useStore((s) => s.activeView);
  const siderCollapsed = useStore((s) => s.siderCollapsed);
  const setSiderCollapsed = useStore((s) => s.setSiderCollapsed);
  const screens = useBreakpoint();
  const isMobile = !screens.md; // < 768px

  const sidebarContent = <MenuRenderer onItemClick={isMobile ? () => setSiderCollapsed(true) : undefined} />;

  return (
    <Layout className="h-screen">
      <AppHeader />

      <Layout>
        {/* Desktop: inline Sider */}
        {!isMobile && (
          <Sider
            width={240}
            collapsedWidth={64}
            collapsible
            collapsed={siderCollapsed}
            onCollapse={(v) => setSiderCollapsed(v)}
            theme="dark"
            trigger={null}
            breakpoint="lg"
            className="overflow-auto"
          >
            <div className="flex items-center justify-center h-12 border-b border-gray-700">
              <span className="text-white font-bold text-sm">
                {siderCollapsed ? 'AE' : 'Agent ERP'}
              </span>
            </div>
            {sidebarContent}
          </Sider>
        )}

        {/* Mobile: Drawer overlay */}
        {isMobile && (
          <Drawer
            open={!siderCollapsed}
            onClose={() => setSiderCollapsed(true)}
            placement="left"
            width={240}
            styles={{ body: { padding: 0, background: '#001529' } }}
            closeIcon={null}
          >
            <div className="flex items-center h-12 px-4 border-b border-gray-700">
              <span className="text-white font-bold text-sm">Agent ERP</span>
            </div>
            {sidebarContent}
          </Drawer>
        )}

        <Content className="overflow-auto bg-white">
          {activeView ? (
            <>
              <PageHeader view={activeView} />
              <div className="px-6 pb-6">
                <ErrorBoundary>
                  <ViewRenderer view={activeView} />
                </ErrorBoundary>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <ErrorBoundary>
                <ViewRenderer view={{
                  id: 'welcome',
                  model: '',
                  type: 'kanban',
                  title: 'Welcome',
                  fields: [],
                }} />
              </ErrorBoundary>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
```

Note: This extracts ErrorBoundary to its own file. See next step.

- [ ] **Step 2: Extract ErrorBoundary to `ErrorBoundary.tsx`**

Create `packages/admin/src/components/ErrorBoundary.tsx`:

```typescript
import React, { Component } from 'react';
import { Result, Button } from 'antd';

export class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Something went wrong rendering this view."
          extra={
            <Button type="primary" onClick={() => this.setState({ hasError: false })}>
              Retry
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 3: Run type check**

Run: `pnpm --filter @erp/admin exec tsc --noEmit`
Expected: zero type errors.

- [ ] **Step 4: Commit**

```bash
git add packages/admin/src/App.tsx packages/admin/src/components/ErrorBoundary.tsx
git commit -m "feat: restructure shell — header, dark collapsible sider, drawer mobile, error boundary extraction"
```

---

### Task 7: Add page transitions to ViewRenderer

**Files:**
- Modify: `packages/admin/src/components/ViewRenderer.tsx`

- [ ] **Step 1: Wrap content in AnimatePresence + motion.div**

```typescript
import React from 'react';
import { Result } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import { ViewSpec } from '../store';
import { FormRenderer } from './FormRenderer';
import { TableRenderer } from './TableRenderer';
import { SearchPanel } from './SearchPanel';

interface Props {
  view: ViewSpec;
}

function renderView(view: ViewSpec) {
  switch (view.type) {
    case 'form':
      return <FormRenderer view={view} />;
    case 'tree':
      return <TableRenderer view={view} />;
    case 'search':
      return <SearchPanel view={view} />;
    case 'kanban':
      return <Result status="info" title="Kanban View" subTitle="Coming soon" />;
    case 'calendar':
      return <Result status="info" title="Calendar View" subTitle="Coming soon" />;
    default:
      return <Result status="warning" title="Unknown View Type" subTitle={`No renderer for "${view.type}"`} />;
  }
}

export const ViewRenderer: React.FC<Props> = ({ view }) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={view.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      {renderView(view)}
    </motion.div>
  </AnimatePresence>
);
```

- [ ] **Step 2: Run type check**

Run: `pnpm --filter @erp/admin exec tsc --noEmit`
Expected: zero type errors.

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/components/ViewRenderer.tsx
git commit -m "feat: add framer-motion fade transitions to ViewRenderer"
```

---

### Task 8: Update FormRenderer — remove Title, add max-w

**Files:**
- Modify: `packages/admin/src/components/FormRenderer.tsx`

- [ ] **Step 1: Remove `<Title>`, add `max-w-3xl mx-auto`**

In `FormRenderer`, replace the return block:

```typescript
// Remove: import { Typography } from 'antd';
// Remove: const { Title } = Typography;

// Replace the return block:
return (
  <div className="max-w-3xl mx-auto">
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSave}
    >
      {renderContent()}
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Save
        </Button>
      </Form.Item>
    </Form>
  </div>
);
```

The full file content after edit — only the import line and return JSX change. `renderContent`, `renderFields`, `renderFlatFields`, `renderWidget` remain identical.

- [ ] **Step 2: Run type check**

Run: `pnpm --filter @erp/admin exec tsc --noEmit`
Expected: zero type errors.

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/components/FormRenderer.tsx
git commit -m "refactor: FormRenderer — remove internal Title, add max-w-3xl constraint"
```

---

### Task 9: Update TableRenderer — remove Title, add scroll.x

**Files:**
- Modify: `packages/admin/src/components/TableRenderer.tsx`

- [ ] **Step 1: Remove `<Title>`, add scroll.x on responsive**

```typescript
import React from 'react';
import { Table, Grid } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ViewSpec } from '../store';

const { useBreakpoint } = Grid;

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

interface Props {
  view: ViewSpec;
}

export const TableRenderer: React.FC<Props> = ({ view }) => {
  const [records] = React.useState<Record<string, unknown>[]>([]);
  const screens = useBreakpoint();

  const columns: ColumnsType<Record<string, unknown>> = view.fields.map((f) => ({
    key: f.name,
    dataIndex: f.name,
    title: f.label ?? f.name,
    render: (_: unknown, record: Record<string, unknown>) => formatCell(record[f.name]),
  }));

  return (
    <Table
      columns={columns}
      dataSource={records}
      rowKey="id"
      locale={{ emptyText: 'No records found' }}
      bordered
      size="middle"
      scroll={!screens.md ? { x: 'max-content' } : undefined}
    />
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/admin/src/components/TableRenderer.tsx
git commit -m "refactor: TableRenderer — remove internal Title, add responsive scroll.x"
```

---

### Task 10: Update SearchPanel — remove Title, responsive layout

**Files:**
- Modify: `packages/admin/src/components/SearchPanel.tsx`

- [ ] **Step 1: Remove `<Title>`, responsive layout, max-w-4xl**

```typescript
import React from 'react';
import { Form, Input, Button, Space, Grid } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { ViewSpec } from '../store';

const { useBreakpoint } = Grid;

interface Props {
  view: ViewSpec;
}

export const SearchPanel: React.FC<Props> = ({ view }) => {
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const isNarrow = !screens.md;

  const handleSearch = (values: Record<string, string>) => {
    console.log('Search:', view.model, values);
  };

  const handleClear = () => {
    form.resetFields();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Form
        form={form}
        layout={isNarrow ? 'vertical' : 'inline'}
        onFinish={handleSearch}
        className={isNarrow ? '' : 'flex-wrap gap-3 mb-4'}
      >
        {view.fields.map((f) => (
          <Form.Item key={f.name} name={f.name} label={f.label ?? f.name}>
            <Input placeholder={f.label ?? f.name} allowClear />
          </Form.Item>
        ))}
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              Search
            </Button>
            <Button onClick={handleClear} icon={<ClearOutlined />}>
              Clear
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/admin/src/components/SearchPanel.tsx
git commit -m "refactor: SearchPanel — remove internal Title, responsive layout, max-w-4xl"
```

---

### Task 11: Update e2e tests — header, breadcrumb, collapsed sider, responsive

**Files:**
- Modify: `packages/admin/e2e/admin.spec.ts`

- [ ] **Step 1: Add new test suites after existing tests**

Append these `test.describe` blocks to the existing file (keep all 22 existing tests):

```typescript
test.describe('Header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setState(page, {
      menuItems: MENU_ITEMS,
      activeMenuId: 'partner_menu',
      user: { id: 1, name: 'Admin', groups: ['admin'] },
    });
  });

  test('renders header with logo and collapse button', async ({ page }) => {
    await expect(page.locator('.ant-layout-header')).toBeVisible();
    await expect(page.locator('.ant-layout-header:has-text("Agent ERP")')).toBeVisible();
    // Collapse button should be visible
    await expect(page.locator('.ant-layout-header button')).toBeVisible();
  });

  test('shows breadcrumbs derived from active menu', async ({ page }) => {
    await page.waitForSelector('.ant-breadcrumb');
    await expect(page.locator('.ant-breadcrumb:has-text("Contacts")')).toBeVisible();
  });

  test('shows user name in header', async ({ page }) => {
    await expect(page.locator('.ant-layout-header:has-text("Admin")')).toBeVisible();
  });
});

test.describe('Collapsed Sider', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setState(page, { menuItems: MENU_ITEMS });
  });

  test('clicking collapse button toggles sider', async ({ page }) => {
    // Sider starts expanded (240px)
    await expect(page.locator('.ant-layout-sider')).toBeVisible();
    // Click collapse button in header
    await page.locator('.ant-layout-header button').first().click();
    // Sider should now be collapsed
    const collapsed = await page.evaluate(() =>
      (window as any).__STORE__.getState().siderCollapsed
    );
    expect(collapsed).toBe(true);
  });

  test('collapsed sider shows only icons', async ({ page }) => {
    await setState(page, { siderCollapsed: true });
    await expect(page.locator('.ant-menu-inline-collapsed')).toBeVisible();
  });
});

test.describe('Responsive', () => {
  test('sider collapses at narrow viewport', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 800, height: 600 });
    await setState(page, { menuItems: MENU_ITEMS });
    // At 800px (< lg breakpoint 992px), sider should auto-collapse
    await page.waitForTimeout(300);
    const collapsed = await page.evaluate(() =>
      (window as any).__STORE__.getState().siderCollapsed
    );
    // antd Sider with breakpoint="lg" triggers onCollapse
    // which syncs to our store
    expect(collapsed).toBe(true);
  });

  test('mobile drawer opens via header button', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 480, height: 800 });
    await setState(page, { menuItems: MENU_ITEMS });
    // At 480px (< md), Drawer should be available
    await page.locator('.ant-layout-header button').first().click();
    // Drawer should be visible
    await expect(page.locator('.ant-drawer')).toBeVisible();
  });
});
```

Also update the existing "Admin Shell" test for branding to account for the header:

In the `test.describe('Admin Shell')` block, update test 3:

```typescript
test('shows Agent ERP branding', async ({ page }) => {
  await page.goto('/');
  // Brand appears in header, sidebar, and potentially Welcome title
  const brandings = page.locator('text=Agent ERP');
  await expect(brandings.first()).toBeVisible();
});
```

And update `test.describe('Form View')` — the form title now comes from PageHeader, not inside FormRenderer:

```typescript
test('renders form title via PageHeader', async ({ page }) => {
  await expect(page.locator('.ant-typography:has-text("Partner Form")')).toBeVisible();
});
```

- [ ] **Step 2: Commit**

```bash
git add packages/admin/e2e/admin.spec.ts
git commit -m "test: add header, breadcrumb, collapsed sider, responsive e2e tests"
```

---

### Task 12: Add E2E Testing section to design spec

**Files:**
- Modify: `docs/superpowers/specs/2026-05-14-agent-erp-design.md`

- [ ] **Step 1: Append Section 13 after Section 12**

```markdown

---

## 13. E2E Testing

### 13.1 Framework

Playwright with local Chrome channel. Tests inject Zustand state via `window.__STORE__.setState()` — no mock API required for UI validation.

### 13.2 Test Coverage (27 tests)

| Category | Tests | What's Verified |
|----------|-------|-----------------|
| Admin Shell | 3 | Layout/Sider/Content render, Welcome message, branding |
| Header | 3 | Header rendering, collapse toggle, breadcrumb path, user dropdown |
| Menu | 4 | Menu items render, submenu expand, leaf click sets active, icon-only collapsed mode |
| Form View | 5 | Title, tabs layout, input rendering, Save button, required field validation |
| Table View | 3 | Title, column headers, empty state |
| Search View | 4 | Title, inline fields, Search/Clear buttons, Clear resets fields |
| Placeholder | 3 | Kanban, Calendar, unknown view type fallback |
| Responsive | 2 | Sider collapsed on < 992px, drawer mode on < 768px |

### 13.3 Running

```bash
npx playwright test --config=packages/admin/playwright.config.ts
```

### 13.4 State Injection Pattern

```typescript
async function setState(page, state) {
  await page.evaluate((s) => {
    (window as any).__STORE__.setState(s);
  }, state);
}
```

The Zustand store is exposed on `window.__STORE__` in `store.ts`, enabling tests to inject menu items, active views, and user state without going through login or API calls.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-05-14-agent-erp-design.md
git commit -m "docs: add Section 13 E2E Testing to design spec"
```

---

### Task 13: Final verification

- [ ] **Step 1: Install all dependencies**

Run: `pnpm install`
Expected: no errors, framer-motion resolved.

- [ ] **Step 2: Type check admin package**

Run: `pnpm --filter @erp/admin exec tsc --noEmit`
Expected: zero type errors.

- [ ] **Step 3: Run unit tests**

Run: `pnpm test`
Expected: all packages pass (data: 13, domain: 23, core: 27, admin: 1).

- [ ] **Step 4: Start dev server and run e2e tests**

Run:
```bash
pnpm --filter @erp/admin dev &
npx playwright test --config=packages/admin/playwright.config.ts
```

Expected: 27/27 tests pass.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final verification — dependencies, types, tests all green"
```

---

## Spec Coverage Self-Review

| Spec Section | Covered By |
|---|---|
| 3.1 Header bar (AppHeader) | Task 3 |
| 3.2 Sidebar redesign | Task 5 (MenuRenderer dark), Task 6 (App.tsx Sider restructure) |
| 3.3 Page header (PageHeader) | Task 4 |
| 3.4 Content area constraints | Tasks 8, 9, 10 (Form/Table/Search max-width) |
| 3.5 Page transitions | Task 7 (framer-motion in ViewRenderer) |
| 3.6 Responsive breakpoints | Task 6 (Sider breakpoint, Drawer mobile), Task 10 (Search layout) |
| 4. Store changes | Task 1 |
| 6. E2E Testing | Task 11 (new tests), Task 12 (spec update) |

---

## Placeholder Scan

- No TBD, TODO, or incomplete steps
- Every step includes actual code or commands
- No "add appropriate error handling" — coverage is explicit
- All file paths match the File Map

---

## Type Consistency Check

- `BreadcrumbItem` defined in Task 1 types.ts, used in Task 3 AppHeader and Task 1 store.ts
- `siderCollapsed` / `setSiderCollapsed` in types/store -> used in Task 3 (AppHeader), Task 6 (App.tsx), Task 11 (e2e)
- `PageHeader` receives `ViewSpec` from store.ts, used in Task 6 App.tsx
- `MenuRenderer` receives `onItemClick?: () => void` — used by App.tsx for drawer close
- `ViewSpec` unchanged across all tasks
- All import paths are relative to `packages/admin/src/`
