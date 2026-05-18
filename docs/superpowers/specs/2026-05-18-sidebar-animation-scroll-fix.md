# Sidebar Animation & Scroll Fix

**Date:** 2026-05-18
**Status:** approved

## Context

Two UX issues in the admin shell:

1. The left sidebar has no animation when collapsing/expanding — width snaps instantly
2. The entire page scrolls vertically, but only the view content (excluding breadcrumbs/PageHeader) should scroll

## Design

### 1. Sidebar Animation

Add CSS `transition` on `.erp-sider-light` for the properties antd's `Sider` component modifies via inline style during collapse: `flex`, `max-width`, `min-width`, `width`.

```css
.erp-sider-light {
  transition: flex 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 2. Scroll Fix

Restructure the Content area into a flex column with two zones:
- **Fixed top**: breadcrumb + PageHeader (`flex-shrink-0`)
- **Scrollable bottom**: view content / welcome screen (`flex: 1`, `overflow-y: auto`)

The inner `<Layout>` (wrapping Sider + Content) must also get `overflow: hidden` to prevent the entire page from scrolling.

**Before:**
```
Content (overflow: auto)
├── breadcrumb
├── PageHeader
└── view content / welcome screen
```

**After:**
```
Content (flex column, overflow: hidden)
├── fixed zone (flex-shrink-0)
│   ├── breadcrumb
│   └── PageHeader
└── scroll zone (flex: 1, overflow-y: auto)
    └── view content / welcome screen
```

Dashboard's `.erp-dashboard` will drop its own `overflow-y: auto` and `min-height: 100%` since scrolling is now handled by the parent scroll zone.

### Files Changed

| File | Change |
|---|---|
| `packages/admin/src/App.tsx` | Restructure Content JSX into fixed + scroll zones; add `overflow: hidden` to inner Layout |
| `packages/admin/src/index.css` | Add sidebar `transition`; remove dashboard self-scroll (`overflow-y: auto`, `min-height: 100%`) |

## Constraints

- No new dependencies
- Mobile drawer behavior unchanged
- Must not break existing page transition animation (`erp-animate-in`)
