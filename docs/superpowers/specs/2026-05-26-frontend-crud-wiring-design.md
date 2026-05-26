# Frontend CRUD Wiring for Tree Views

**Date:** 2026-05-26
**Status:** Draft

## Overview

Hook up the `TableRenderer` to real API data so users can create, edit, and delete records directly from tree/list views. The backend CRUD APIs already exist (GroupController, UserController, PartnerController). This work makes the frontend functional.

## Current State

- `TableRenderer` renders with `useState([])` — never fetches data
- `FormRenderer.handleSave` does `console.log` — never submits
- All backend CRUD routes are wired and functional
- Groups, Users, and Partners all have tree views ready

## Design

### 1. `useCrud` Hook

**New file:** `packages/admin/src/hooks/useCrud.ts`

```ts
function useCrud(model: string) {
  // Returns: { records, loading, error, fetchAll, create, update, remove }
}
```

- Derives API path from model name: strip `res.` prefix, lowercase remainder → `/api/<name>`
  - `res.groups` → `/api/groups`, `res.users` → `/api/users`, `res.partner` → `/api/partners`
- Reads `token` from Zustand store for `Authorization: Bearer <token>` header
- `fetchAll()` → GET, `create(data)` → POST, `update(id, data)` → PUT, `remove(id)` → DELETE
- On successful create/update/delete, auto-calls `fetchAll()` to refresh the list
- Manages `loading` and `error` state internally

### 2. TableRenderer Changes

**Edit:** `packages/admin/src/components/TableRenderer.tsx`

New optional `crud` prop:

```ts
interface CrudActions {
  onSave: (id: number | null, data: Record<string, unknown>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}
```

New props: `records: Record<string, unknown>[]`, `loading: boolean`, `crud?: CrudActions`, `error?: string | null`.

**When `crud` is provided:**

- **Create**: a "New <Title>" button in the toolbar above the table. Clicking it prepends a pseudo-row (`id: 'new'`) to the local record list and expands it, showing an empty form. "Save" in that row calls `onSave(null, data)`, which calls the hook's `create()`. On success, the list refreshes and the pseudo-row is removed.
- **Edit**: row expansion (antd `expandable`). Clicking the expand icon on a row opens an inline form with the view's fields, pre-filled with current values. "Save" and "Cancel" buttons in the expanded area. Save calls `onSave(id, data)`.
- **Delete**: a delete icon per row (rightmost column), wrapped in `Popconfirm` ("Delete this item?").
- **Error display**: antd `Alert` banner above table when `error` is set, auto-clears on next successful fetch.

**When `crud` is omitted:** current display-only behavior unchanged (empty array, no actions).

### 3. ViewRenderer Integration

**Edit:** `packages/admin/src/components/ViewRenderer.tsx`

For `view.type === 'tree'`:
- Call `useCrud(view.model)` on mount
- Pass `records`, `loading`, `error`, and `crud` callbacks to `TableRenderer`

```tsx
case 'tree': {
  const { records, loading, error, create, update, remove } = useCrud(view.model);
  return (
    <TableRenderer
      view={view}
      records={records}
      loading={loading}
      error={error}
      crud={{
        onSave: async (id, data) => { id != null ? await update(id, data) : await create(data); },
        onDelete: async (id) => { await remove(id); },
      }}
    />
  );
}
```

Note: `useCrud` is called inside the `tree` case, not at the top of `renderView`. The `switch` dispatches directly, so hooks rules are satisfied.

### 4. Error Handling

- API errors → `useCrud` sets `error` string → `TableRenderer` shows antd `Alert` banner
- Save/delete failures: row stays in place, error banner appears. No optimistic removal on delete failure.
- Empty required fields: antd `Form` handles validation via `required` rules from `ViewField`

### 5. Edge Cases

- **Empty list**: antd `Table` empty state ("No records found") shown until user creates first record
- **Loading state**: antd `Spin` wrapping the table during initial fetch
- **Create row validation**: required fields validated before POST; if API rejects, form stays open with error
- **Concurrent edits**: last write wins, no conflict detection in this iteration
- **Large lists**: no pagination in this iteration (TableRenderer already uses `pagination={false}`)

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `packages/admin/src/hooks/useCrud.ts` | Create | Data fetching/mutation hook |
| `packages/admin/src/components/TableRenderer.tsx` | Modify | Add crud prop, expandable rows, toolbar, delete button |
| `packages/admin/src/components/ViewRenderer.tsx` | Modify | Wire useCrud into tree view dispatch |

## Testing

- **`useCrud` unit tests** (vitest): mock `fetch`, test all CRUD operations, error state, loading state
- **`TableRenderer` unit tests** (vitest): verify toolbar renders with crud prop, expand/collapse, delete popconfirm, no actions without crud
- **e2e (Playwright)**: create a group → verify it appears in list → edit name → verify change → delete → verify removed
