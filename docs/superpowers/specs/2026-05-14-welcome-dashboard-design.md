# Welcome Dashboard Redesign

**Date:** 2026-05-14
**Status:** Approved

## Overview

Replace the current generic welcome screen with a data dashboard showing key metrics, charts, recent activity, and quick actions. First screen after login.

## Architecture

Single-component change — replace `WelcomeScreen` in `App.tsx` + add CSS styles in `index.css`. No new files, no backend changes.

## Layout

Top-to-bottom stacking:

1. **Greeting row** — "Good morning, [user name]" left-aligned, Syne font
2. **Stats cards** — 3-4 gradient-filled cards in a horizontal row
3. **Content row** — main chart (left, wider) + recent activity list (right, narrower)
4. **Quick actions** — pill/tag buttons, first one brand-filled, rest outlined

## Visual Design

### Stats Cards
- Gradient backgrounds: blue (`#1890ff`→`#40a9ff`), green (`#52c41a`→`#73d13d`), gold (`#faad14`→`#ffc53d`), purple (`#722ed1`→`#9254de`)
- White text: metric label (small, 0.7 opacity), large number (26px, bold), growth indicator (↑ X% vs last month)
- Border radius 12px, colored box-shadow matching gradient
- Responsive: 4 columns on desktop, 2 on tablet, 1 on mobile

### Main Chart
- White card container, 12px border-radius, subtle box-shadow
- Title in card header
- Bar chart rendered with pure CSS (flex-end aligned bars with gradient backgrounds inside a flex container)
- 6-12 bars representing monthly data, blue gradient bars

### Recent Activity List
- White card, same styling as chart card
- List of items with colored left icon + text line placeholder
- 3-5 items visible

### Quick Action Pills
- Horizontal wrapping flex row
- First pill: brand color filled (`#1890ff`), white text
- Other pills: white background, `#e8ecf1` border, gray text
- Border radius 100px (fully rounded)
- Hover: subtle lift or color shift

### Animations (framer-motion)
- Container staggered: children appear with 0.1s delay
- Each section: fade up 20px, 0.4s duration
- Stats cards: slight scale-in from 0.95

## Content

Stats cards show data from models already defined in the system:
- **Users**: count from `res.users` where `active = true`
- **Partners**: count from `res.partner` where `active = true`
- **Orders/Deals**: placeholder (no order model yet, show a static value or hide)
- Fourth card TBD based on available models

Since the welcome screen currently has no data fetching, stats can start as static placeholders. The component structure should make it easy to wire real data later.

## Files Changed

| File | Action |
|------|--------|
| `packages/admin/src/App.tsx` | Replace `WelcomeScreen` component |
| `packages/admin/src/index.css` | Replace `.erp-welcome*` styles with dashboard styles |

## Testing

- Component renders all sections without crashing (greeting, cards, chart area, actions)
- Responsive: cards stack on mobile
- Empty state: handles `user = null` gracefully (greeting shows "Guest")
