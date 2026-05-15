# Agent ERP — Documentation Index

> Milestone 1: Core framework + Admin shell with auth, dashboard, responsive layout

## Specs

| Date | Spec | Description |
|------|------|-------------|
| 2026-05-14 | [agent-erp-design](specs/2026-05-14-agent-erp-design.md) | Overall project architecture: 4-layer framework, module system, data/domain/core/admin layers |
| 2026-05-14 | [header-sidebar-redesign](specs/2026-05-14-header-sidebar-redesign.md) | Header bar (brand + notification + user pill) and sidebar (light theme, collapse, section labels) |
| 2026-05-14 | [welcome-dashboard-design](specs/2026-05-14-welcome-dashboard-design.md) | Dashboard page: stat cards, chart placeholder, activity list, action pills |
| 2026-05-15 | [login-redesign](specs/2026-05-15-login-redesign.md) | Login page: gradient blobs, centered responsive card, "A" logo, refined inputs/button |
| 2026-05-15 | [admin-layout-redesign](specs/2026-05-15-admin-layout-redesign.md) | Admin shell layout: header, collapsible sidebar, responsive breakpoints, page transitions |

## Plans

| Date | Plan | Implements |
|------|------|------------|
| 2026-05-14 | [agent-erp-implementation](plans/2026-05-14-agent-erp-implementation.md) | agent-erp-design |
| 2026-05-14 | [header-sidebar-redesign](plans/2026-05-14-header-sidebar-redesign.md) | header-sidebar-redesign |
| 2026-05-14 | [welcome-dashboard](plans/2026-05-14-welcome-dashboard.md) | welcome-dashboard-design |
| 2026-05-15 | [login-redesign](plans/2026-05-15-login-redesign.md) | login-redesign |
| 2026-05-15 | [admin-layout-redesign](plans/2026-05-15-admin-layout-redesign.md) | admin-layout-redesign |

## Evolution

```
agent-erp-design ─────────────────────────────────────────────► (ongoing)
  ├── login-page-design (2026-05-14) → login-redesign (2026-05-15)
  ├── welcome-dashboard-design (2026-05-14)
  ├── header-sidebar-redesign (2026-05-14)
  └── admin-layout-redesign (2026-05-15)
```

- **login-page-design** was superseded by **login-redesign** — the original auth system spec is preserved in agent-erp-design
- All specs map 1:1 to plans; specs describe what and why, plans describe how in bite-sized tasks
