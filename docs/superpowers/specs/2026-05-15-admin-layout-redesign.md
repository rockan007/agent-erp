# Admin Layout Redesign — Design Spec

**Date:** 2026-05-15
**Status:** Approved
**Goal:** Upgrade admin shell from basic antd Layout to a professional management console layout with header, collapsible dark sidebar, responsive breakpoints, page transitions, and e2e testing documentation.

---

## 1. Summary

The current admin shell uses a bare `<Layout>` with a light-themed `<Sider>` and `<Content>`. It works but lacks three things that make a management console feel finished: a top header bar, a collapsible sidebar with visual depth, and responsive behavior. This redesign adds those without introducing complexity beyond standard antd + Tailwind + framer-motion.

---

## 2. Before / After

```
Before:
┌──────────────┬──────────────────────────────────────────┐
│  Agent ERP   │                                          │
│  (纯文字)     │          内容区（无约束拉伸）              │
│              │                                          │
│  ● Contacts  │                                          │
│  ● Partners  │                                          │
│  ● Settings  │                                          │
│  ● Users     │                                          │
│  ...固定240px │                                          │
└──────────────┴──────────────────────────────────────────┘

After:
┌──────────────────────────────────────────────────────────┐
│ ☰  Agent ERP  │  Contacts / Partners  │      👤 管理员 ▼  │  ← 顶栏 48px
├──────────┬───────────────────────────────────────────────┤
│          │  合作伙伴                               [新建] │  ← 页面标题栏
│ 暗色侧栏  │──────────────────────────────────────────────│
│ 可折叠    │                                               │
│          │  表单区（max-w-3xl 居中）                      │
│          │                                               │
└──────────┴───────────────────────────────────────────────┘
```

---

## 3. Components

### 3.1 Header bar — `AppHeader`

Location: `packages/admin/src/components/AppHeader.tsx` (new)

```
┌──────────────────────────────────────────────────────────┐
│ ☰  Agent ERP  │  Contacts / Partners  │      👤 管理员 ▼  │
└──────────────────────────────────────────────────────────┘
  折叠按钮  品牌   面包屑导航                    用户下拉菜单
```

- **Height**: 48px, `display: flex`, `align-items: center`
- **Collapse button**: `<Button type="text" icon={<MenuFoldOutlined />} />` triggers `useStore.setSiderCollapsed()`
- **Breadcrumb**: `<Breadcrumb items={breadcrumbItems} />` — derived from `activeMenuId` by walking the menu tree upward
- **User area**: `<Dropdown menu={{ items: [...] }}>` — shows user name + avatar, items: "My Profile", "Logout"
- **Store additions**: `siderCollapsed: boolean`, `breadcrumb: { path: {id, name}[] }`

### 3.2 Sidebar — sider redesign

- **Theme**: `theme="dark"` (antd built-in: `#001529` background, light text)
- **Collapsible**: `collapsed={siderCollapsed}`, `onCollapse` synced to store
- **Breakpoint**: `breakpoint="lg"` — auto-collapses below 992px
- **Collapsed width**: 64px (icons only), **expanded**: 240px
- **Brand area**: 
  - Expanded: "Agent ERP" text + small logo icon
  - Collapsed: logo icon only
- **Menu**: `<Menu theme="dark" mode="inline" />` inherits dark colors natively from antd
- **Mobile (<768px)**: Sider becomes `drawer` mode — `<Drawer>` overlay triggered by header collapse button, closes on item click

### 3.3 Page header — `PageHeader`

Location: `packages/admin/src/components/PageHeader.tsx` (new)

```
┌───────────────────────────────────────────────────┐
│  合作伙伴                                    [新建] │
└───────────────────────────────────────────────────┘
```

- **Left**: `<Title level={4}>{view.title}</Title>`
- **Right**: `<Space>` of action buttons (extensible via ViewSpec `actions?: { label, icon, onClick }[]`)
- **Spacing**: `px-6 py-4`, bottom border `border-b border-gray-100`

### 3.4 Content area constraints

| View Type | Max Width | Rationale |
|-----------|-----------|-----------|
| `form` | `max-w-3xl` (48rem) | Forms look bad stretched full-width |
| `tree` | `max-w-full` | Tables benefit from full width |
| `search` | `max-w-4xl` (56rem) | Inline search panels don't need edge-to-edge |
| placeholder | `max-w-lg` (32rem) | Centered Result component |

- All views: `mx-auto` for centering, `px-6 pb-6` for consistent content padding
- Responsive: padding reduces to `px-4` on `< md` screens

### 3.5 Page transitions

```tsx
// ViewRenderer wraps content in:
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
```

- **Library**: `framer-motion` (standard in React ecosystem, antd-recommended)
- **Effect**: 150ms fade-in + slight upward movement
- **Scope**: only the content area, not the shell (header/sider are stable)
- **`mode="wait"`**: old view exits before new enters (no overlap)

### 3.6 Responsive breakpoints

| Breakpoint | Sider | Content | Form Layout |
|------------|-------|---------|-------------|
| `>= lg` (992px) | Expanded by default, collapsible | Standard padding | `vertical` |
| `>= md` (768px) | Collapsed 64px | Reduced padding | `vertical` |
| `< md` | Drawer overlay | `px-4` | `vertical` |

- antd Sider `breakpoint="lg"` handles auto-collapse
- `< md`: Sider renders as `<Drawer>` instead of inline `<Sider>`, triggered by header button
- `< md`: Search form switches from `layout="inline"` to `layout="vertical"`

---

## 4. Store Changes (`store.ts`)

```typescript
interface AppState {
  // ... existing fields ...
  siderCollapsed: boolean;
  // Derived from activeMenuId by walking menu tree
  breadcrumbs: { id: string; name: string }[];
  
  setSiderCollapsed: (collapsed: boolean) => void;
  setBreadcrumbs: (items: { id: string; name: string }[]) => void;
}
```

`breadcrumbs` are computed when `activeMenuId` or `menuItems` change (via a `useEffect` in `App.tsx` or `MenuRenderer`), walking parent references from the selected node up to root.

---

## 5. File Changes

| File | Action | Summary |
|------|--------|---------|
| `packages/admin/src/App.tsx` | Modify | Add Header, restructure Layout, add drawer Sider for mobile |
| `packages/admin/src/components/AppHeader.tsx` | New | Logo + collapse + breadcrumb + user dropdown |
| `packages/admin/src/components/PageHeader.tsx` | New | View title + action buttons |
| `packages/admin/src/components/MenuRenderer.tsx` | Modify | Support dark theme, collapsed icon-only mode, breadcrumb build |
| `packages/admin/src/components/ViewRenderer.tsx` | Modify | Add AnimatePresence + motion.div wrapper |
| `packages/admin/src/components/FormRenderer.tsx` | Modify | Remove internal Title, add max-w-3xl constraint |
| `packages/admin/src/components/TableRenderer.tsx` | Modify | Remove internal Title, add max-w-full + scroll.x on mobile |
| `packages/admin/src/components/SearchPanel.tsx` | Modify | Remove internal Title, add max-w-4xl, responsive layout |
| `packages/admin/src/store.ts` | Modify | Add siderCollapsed, breadcrumbs, new setters |
| `packages/admin/package.json` | Modify | Add `framer-motion` dependency |
| `packages/admin/src/index.css` | Modify | Add dark sidebar utility classes (if needed beyond antd) |
| `packages/admin/e2e/admin.spec.ts` | Modify | Add tests for header, breadcrumb, collapsed sider, responsive |

---

## 6. E2E Testing

### 6.1 Framework

Playwright with local Chrome channel, injecting state via `window.__STORE__.setState()`.

### 6.2 Test Coverage

| Category | Test Count | What's Verified |
|----------|------------|-----------------|
| Admin Shell | 3 | Layout/Sider/Content render, Welcome message, branding |
| Header | 3 | Header rendering, collapse toggle, breadcrumb path, user dropdown |
| Menu | 4 | Menu items render, submenu expand, leaf click sets active, icon-only collapsed mode |
| Form View | 5 | Title, tabs layout, input rendering, Save button, required field validation |
| Table View | 3 | Title, column headers, empty state |
| Search View | 4 | Title, inline fields, Search/Clear buttons, Clear resets fields |
| Placeholder | 3 | Kanban, Calendar, unknown view type fallback |
| Responsive | 2 | Sider collapsed on < 992px, drawer mode on < 768px |

Total: **27 tests** (22 existing + 5 new)

### 6.3 Running

```bash
npx playwright test --config=packages/admin/playwright.config.ts
```

### 6.4 Design Spec Update

Section 13 "E2E Testing" will be added to `docs/superpowers/specs/2026-05-14-agent-erp-design.md`, covering:
- Framework choice (Playwright + Chrome channel)
- Test categories and coverage table
- State injection pattern via `window.__STORE__`
- Run command and CI considerations

---

## 7. Non-Goals

- No dark mode toggle (sider is always dark, content is always light)
- No drag-to-resize sidebar
- No notification bell / message center in header
- No multi-tab page system (single view at a time)
- No theme editor or runtime theme switching

---

## 8. Design Decisions

| Decision | Rationale |
|----------|-----------|
| Dark sidebar, light content | Standard admin pattern (Ant Design Pro, Linear), creates visual hierarchy |
| framer-motion for transitions | Most popular React animation lib, antd-recommended, 150ms is barely noticeable but smooth |
| PageHeader as separate component | Shared by all views, avoids duplicating title rendering in Form/Table/Search |
| Content max-width per view type | Forms look bad edge-to-edge; tables need full width; enforced at renderer level |
| Drawer sidebar on mobile | Mobile screens lack space for 240px inline; Drawer overlay is standard mobile pattern |
| Breadcrumbs from menu tree | No need for manual breadcrumb config; derived automatically from menu hierarchy |
| No tRPC for breadcrumbs | Breadcrumbs are pure UI state derived from menuItems + activeMenuId, no API needed |
