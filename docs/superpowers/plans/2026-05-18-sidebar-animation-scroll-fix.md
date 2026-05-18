# Sidebar Animation & Scroll Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add smooth CSS transition to sidebar collapse/expand and fix Content area scrolling so only the view content (below breadcrumbs) scrolls.

**Architecture:** Pure CSS changes — add `transition` on `.erp-sider-light` for antd Sider inline-style properties, restructure Content JSX into a flex column with fixed (breadcrumb) and scrollable (view) zones, and remove dashboard-level scroll.

**Tech Stack:** React, antd Layout, Tailwind CSS, PostCSS

---

### Task 1: Add sidebar CSS transition

**Files:**
- Modify: `packages/admin/src/index.css:707-711`

- [ ] **Step 1: Add transition properties to `.erp-sider-light`**

In `packages/admin/src/index.css`, replace the `.erp-sider-light` block (lines 707-711):

```css
.erp-sider-light {
  background: #fafbfc !important;
  border-right: 1px solid #e8ecf1;
  overflow: auto;
  transition: flex 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
```

- [ ] **Step 2: Verify build passes**

```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/index.css
git commit -m "feat: add CSS transition to sidebar collapse/expand"
```

---

### Task 2: Restructure Content into fixed + scroll zones

**Files:**
- Modify: `packages/admin/src/App.tsx:200-295`

- [ ] **Step 1: Replace the Content section in App.tsx**

In `packages/admin/src/App.tsx`, replace lines 200-295 (the `return` statement of the `App` component) with the following:

```tsx
  return (
    <Layout className="h-screen">
      <AppHeader />

      <Layout className="overflow-hidden">
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

        {/* Content */}
        <Content className="erp-content">
          {activeView ? (
            <>
              <div className="erp-content-fixed">
                <PageHeader view={activeView} />
              </div>
              <div className="erp-content-scroll">
                <div className="erp-animate-in">
                  <div className="px-6 py-6">
                    <ErrorBoundary>
                      <ViewRenderer view={activeView} />
                    </ErrorBoundary>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="erp-content-fixed">
                <div className="erp-content-breadcrumb">
                  <span className="erp-breadcrumb-home">Home</span>
                </div>
              </div>
              <div className="erp-content-scroll">
                <ErrorBoundary>
                  <WelcomeScreen />
                </ErrorBoundary>
              </div>
            </>
          )}
        </Content>
      </Layout>
    </Layout>
  );
```

- [ ] **Step 2: Verify build passes**

```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/App.tsx
git commit -m "feat: restructure Content into fixed breadcrumb + scrollable view zones"
```

---

### Task 3: Add Content layout CSS and fix dashboard scroll

**Files:**
- Modify: `packages/admin/src/index.css:32-54` (erp-content section)
- Modify: `packages/admin/src/index.css:417-422` (erp-dashboard section)

- [ ] **Step 1: Update `.erp-content` to use flex column layout**

In `packages/admin/src/index.css`, replace the `.erp-content` block (lines 32-38):

```css
.erp-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  background:
    radial-gradient(ellipse 70% 50% at 25% 85%, rgba(24, 144, 255, 0.03) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 75% 15%, rgba(224, 123, 76, 0.02) 0%, transparent 55%),
    var(--color-content-bg);
}
```

- [ ] **Step 2: Add `.erp-content-fixed` and `.erp-content-scroll` classes**

Add after the `.erp-content` rule (after line 38):

```css
.erp-content-fixed {
  flex-shrink: 0;
}

.erp-content-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
```

- [ ] **Step 3: Remove redundant scroll from `.erp-content`**

Remove the old `.erp-content` scrollbar hiding rules (lines 167-173):

```css
/* Remove these lines (167-173):
.erp-content {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.erp-content::-webkit-scrollbar {
  display: none;
}
*/
```

And add them to `.erp-content-scroll` instead. Add after the `.erp-content-scroll` rule from Step 2:

```css
.erp-content-scroll {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 0.3s ease;
}
.erp-content-scroll:hover {
  scrollbar-color: rgba(0, 0, 0, 0.08) transparent;
}
.erp-content-scroll::-webkit-scrollbar {
  width: 4px;
}
.erp-content-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.erp-content-scroll::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 2px;
  transition: background 0.3s ease;
}
.erp-content-scroll:hover::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.08);
}
```

- [ ] **Step 4: Remove `overflow-y: auto` and `min-height: 100%` from `.erp-dashboard`**

In `packages/admin/src/index.css`, replace the `.erp-dashboard` block (lines 418-422):

```css
.erp-dashboard {
  padding: 32px 36px 48px;
}
```

- [ ] **Step 5: Verify build passes**

```bash
pnpm --filter @erp/admin exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add packages/admin/src/index.css
git commit -m "fix: add Content flex layout classes, fix dashboard scroll, style scrollbar on scroll zone"
```

---

### Task 4: Visual verification

- [ ] **Step 1: Start the dev server**

```bash
pnpm --filter @erp/admin dev
```

- [ ] **Step 2: Open browser and verify**

Navigate to `http://localhost:3000` (or the port shown in terminal). Verify:

1. **Sidebar animation**: Click the hamburger button — sidebar should smoothly transition between 220px and 64px (about 0.25s)
2. **Page scroll**: The entire page should not scroll — only the area below breadcrumbs should scroll
3. **Breadcrumb fixed**: When scrolling content, breadcrumb (Home or page breadcrumb) should stay visible at top
4. **Mobile drawer**: Still works correctly (no regression)

- [ ] **Step 3: Commit any final fixes if needed**
