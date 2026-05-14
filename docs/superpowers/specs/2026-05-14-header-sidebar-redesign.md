# Header & Sidebar Redesign

**Date:** 2026-05-14
**Status:** Approved

## Overview

Redesign the top header bar and left sidebar navigation with a modern SaaS aesthetic: brand-colored header, light sidebar with sectioned navigation, and streamlined information architecture.

## Architecture

Three-component change — `AppHeader`, sidebar layout in `App.tsx`, and `index.css`. The `MenuRenderer` keeps its logic but gets style updates for light theme. No new files, no backend changes.

### Changes at a glance

| Component | Change |
|-----------|--------|
| Header | Brand-colored gradient bg, logo+name left, notification bell + user pill right |
| Sidebar | Light bg (#fafbfc), hamburger collapse button, menu sections, left accent bar active |
| Breadcrumb | Moved from header to content area top |
| User presence | Removed from sidebar footer, consolidated into header pill |

## Visual Design

### Header Bar (52px)

- **Background:** Brand gradient `linear-gradient(135deg, #1890ff, #096dd9)`
- **Left:** Logo mark (28px rounded square, white semi-transparent bg) + "Agent ERP" (white, Syne bold 15px)
- **Right:** Notification bell icon (subtle hover effect) + user pill button
- **User pill:** Semi-transparent white background, avatar initial + user name + dropdown arrow. Click opens dropdown with "My Profile" / "Logout"

### Sidebar (220px collapsed to 64px)

- **Background:** `#fafbfc` (light gray-white), right border `1px solid #e8ecf1`
- **Top:** Section label "导航菜单" + hamburger collapse button (3 horizontal lines, right-aligned)
- **Menu items:** 12.5px font, 9px vertical padding, 14px horizontal padding
  - **Active:** Left 3px brand-blue border + light blue background (`rgba(24,144,255,0.05)`) + blue text + semibold
  - **Inactive:** `#6b726e` text, transparent left border
  - **Hover:** Light gray background transition
  - **Icons:** 14px, matching text color
- **Bottom section:** Divided by `border-top`, "系统" section label, system settings menu item
- **No user panel in sidebar footer**

### Collapse Button (Hamburger)

- Three horizontal lines (14px × 1.5px), 3px gap
- Color: `#9e9890`, 28px × 28px click area, 6px border-radius
- Positioned top-right of sidebar, next to section label
- Collapsed state: sidebar shrinks to 64px, shows only icon marks

### Breadcrumb

- Moved to content area, below header, above page content
- White background, 12px vertical padding, 20px horizontal
- Separator: `/`, current page bolded at end
- Bottom border: `1px solid #f0f2f5`

### Responsive

- Mobile (< 768px): Sidebar becomes drawer overlay (same as current). Header keeps brand + user pill. Breadcrumb stays in content area.

## Files Changed

| File | Action |
|------|--------|
| `packages/admin/src/components/AppHeader.tsx` | Rewrite: add brand logo, remove breadcrumb, add notification icon, redesign user pill |
| `packages/admin/src/App.tsx` | Update sidebar layout: remove brand area, add hamburger button, remove user presence footer, move breadcrumb to content area |
| `packages/admin/src/components/PageHeader.tsx` | Add breadcrumb rendering |
| `packages/admin/src/index.css` | Replace sidebar dark styles with light theme, new header styles, hamburger button, breadcrumb styles |

## Testing

- Header renders brand logo, notification icon, user pill
- Sidebar renders light background, hamburger button, section labels, menu items with left-bar active state
- Collapse toggle works: hamburger click collapses sidebar to 64px
- Breadcrumb renders in content area, not in header
- User dropdown still works (profile, logout)
- Mobile drawer still works
- Responsive: mobile breakpoint behavior unchanged
