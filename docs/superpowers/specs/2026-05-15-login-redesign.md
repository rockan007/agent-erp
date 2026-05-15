# Login Page Redesign

**Date:** 2026-05-15
**Status:** Approved

## Overview

Redesign the login page with a modern SaaS aesthetic: centered floating card on a light gradient-blob background, brand kept at top-left corner, refined input and button styling.

## Current State

- Full-screen blue gradient background (`#096dd9` → `#1890ff` → `#40a9ff`)
- Card aligned to the right (`justify-content: flex-end`, `margin-right: 72px`)
- 300px wide white card with 12px border-radius
- Top-left brand: "E" initial + "Agent ERP" + "智能企业管理平台"
- Bottom wave decorations + 3 floating squares
- "欢迎登录" title + subtitle + username/password inputs + gradient blue button

## Architecture

Single-component change — `LoginPage.tsx` plus CSS updates in `index.css`. No new files, no backend changes.

### Changes at a glance

| Element | Change |
|---------|--------|
| Background | Blue gradient → light blue-white (`#f0f4ff`) with 3 gradient blobs |
| Card | Right-aligned 300px → centered 320px, 18px border-radius, dual-layer shadow |
| Brand | Keep top-left (desktop), center-top (mobile) — unchanged position |
| Inputs | Default antd → custom styled: 10px radius, `#f7f8fa` bg, `#e8ecf1` border |
| Button | Similar gradient but 10px radius, 44px height, glow shadow |
| Decorations | Waves + squares removed, replaced by gradient blobs |
| Logo mark | "E" → "A" to match main header brand |

## Visual Design

### Background (`#f0f4ff`)

- Light blue-white base
- 3 radial gradient blobs positioned absolutely:
  - Top-right: 280px, blue `rgba(24,144,255,0.15)` → transparent
  - Bottom-left: 240px, purple `rgba(114,46,209,0.10)` → transparent
  - Mid-center: 140px, blue `rgba(24,144,255,0.06)` → transparent
- Blobs are `pointer-events: none`, purely decorative

### Login Card (320px × auto)

- **Background:** white
- **Border-radius:** 18px
- **Padding:** 38px 32px
- **Shadow:** dual-layer — `0 2px 4px rgba(0,0,0,0.03)` + `0 12px 36px rgba(0,0,0,0.08)`
- **Position:** centered via flexbox (`align-items: center; justify-content: center`)

### Brand (top-left, unchanged position)

- Logo mark: 30px × 30px, 8px radius, blue gradient, white "A" initial
- Name: "Agent ERP", 14px, bold, `#1a1a1a`
- Slogan: "智能企业管理平台", 9px, `#9e9890`

### Input Fields

- Height: 42px
- Border-radius: 10px
- Background: `#f7f8fa`
- Border: 1px solid `#e8ecf1`
- Prefix icon: muted gray (`#bfbfbf`)
- Focus state: border color transitions to `#1890ff`

### Login Button

- Height: 44px
- Border-radius: 10px
- Background: `linear-gradient(135deg, #1890ff, #096dd9)`
- Box-shadow: `0 4px 14px rgba(24,144,255,0.3)`
- Hover: gradient shifts lighter, shadow increases
- Text: white, 13px, weight 600

### Animations

- **Card entrance:** fade in + slide up 24px (framer-motion, 0.4s ease-out)
- **Error shake:** horizontal shake (same as current, preserved)
- **Exit transition:** fade out on successful login (same as current, preserved)

### Responsive

- **< 640px:**
  - Brand centers horizontally (`left: 50%; transform: translateX(-50%)`)
  - Card: `max-width: 320px`, margin `0 20px`, padding reduced to 28px 22px
  - Border-radius: 16px
  - Blobs: smaller (200px / 180px), repositioned

## Files Changed

| File | Action |
|------|--------|
| `packages/admin/src/components/LoginPage.tsx` | Rewrite: new background blobs, centered card, updated brand logo to "A", refined input styles |
| `packages/admin/src/index.css` | Replace login page CSS: remove waves/squares, add blob styles, update card/input/button styles |

## Testing

- Login page renders with light background + gradient blobs
- Card is centered horizontally and vertically
- Brand logo shows "A" (not "E") in top-left
- Inputs have new styling (10px radius, light gray bg)
- Button has glow shadow
- Login flow still works (valid credentials → dashboard, invalid → error + shake)
- Exit fade animation works
- Mobile: card adapts to viewport width, brand centers at top
- No regressions in dashboard/header/sidebar styles
