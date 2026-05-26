# Tree-to-Form Navigation Design

**Date:** 2026-05-26
**Status:** Draft

## Overview

Non-editable tree views (users, partners) currently have no way to create or edit records. Use the existing `editable` flag as the switch: `editable: true` keeps inline CRUD, otherwise the tree shows a "New" button and clickable rows that navigate to the corresponding form view. The form view ID is derived from the model name: `<model>.form`.

## Current State

- Tree views with `editable: true` (groups) support inline CRUD
- Tree views without `editable` are display-only — no create/edit entry points
- `FormRenderer` is static: `handleSave` only does `console.log`, no data loading or API submission
- Store has `selectMenu(id)` for menu→view navigation, but no cross-view navigation

## Design

### 1. Store: navigateToView + editRecordId

**Edit:** `packages/admin/src/types.ts` — add to `AppState`:

```ts
editRecordId: number | null;
navigateToView: (viewId: string, recordId?: number) => void;
```

**Edit:** `packages/admin/src/store.ts`:

```ts
editRecordId: null,

navigateToView: (viewId, recordId) => {
  const { viewsMap } = get();
  const view = viewsMap[viewId] ?? null;
  set({ activeView: view, editRecordId: recordId ?? null });
},
```

### 2. TreeCrudPage: editable switch

**Edit:** `packages/admin/src/components/ViewRenderer.tsx`

`editable` 决定两种模式，form view id 按约定推导 `\`${view.model}.form\``：

```tsx
const TreeCrudPage: React.FC<{ view: ViewSpec }> = ({ view }) => {
  const { records, loading, error, create, update, remove } = useCrud(view.model);
  const navigateToView = useStore((s) => s.navigateToView);

  if (view.editable) {
    // 行内编辑
    return (
      <TableRenderer
        view={view} records={records} loading={loading} error={error}
        crud={{ onSave: ..., onDelete: ... }}
      />
    );
  }

  // 跳转 form：form view id = model.form
  const formViewId = `${view.model}.form`;
  return (
    <TableRenderer
      view={view} records={records} loading={loading}
      onNewClick={() => navigateToView(formViewId)}
      onRowClick={(record) => navigateToView(formViewId, record.id as number)}
    />
  );
};
```

### 3. TableRenderer: onNewClick + onRowClick

**Edit:** `packages/admin/src/components/TableRenderer.tsx`

Two new optional props (独立于 `crud`，互斥):

```ts
interface Props {
  // ... existing
  onNewClick?: () => void;
  onRowClick?: (record: Record<string, unknown>) => void;
}
```

- `onNewClick` → 显示 "New <Title>" 按钮
- `onRowClick` → 行变可点击，antd Table `onRow` 返回 `{ onClick: () => onRowClick(record) }`

与 `crud` 互斥：`crud` 优先（editable 模式），`onNewClick`/`onRowClick` 是非 editable 模式。

### 4. FormRenderer: 加载和提交数据

**Edit:** `packages/admin/src/components/FormRenderer.tsx`

New prop: `recordId?: number`

- `recordId` 有值 → `useEffect` 调 `GET /api/<model>/:id` 获取数据 → `form.setFieldsValue(data)`
- `recordId` 为空 → 空表单
- `handleSave` → 有 `recordId` 调 `PUT` (update)，无则 `POST` (create)

数据获取直接用 `useCrud` 的 `fetchOne`（需新增），或用 `useEffect` + `fetch`。

### 5. ViewRenderer: 传 recordId 给 FormRenderer

**Edit:** `packages/admin/src/components/ViewRenderer.tsx`

```tsx
case 'form':
  return <FormRenderer view={view} recordId={editRecordId} />;
```

从 store 读 `editRecordId`。

### 6. useCrud: 加 fetchOne

**Edit:** `packages/admin/src/hooks/useCrud.ts`

```ts
const fetchOne = useCallback(async (id: number): Promise<Record<string, unknown> | null> => {
  const res = await fetch(`${apiPath}/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}, [apiPath, authHeaders]);
```

返回单条记录，存在则返回对象，失败抛异常。

## Data Flow

```
Tree (非 editable)
  ├── "New"  → navigateToView('res.users.form')     → FormRenderer(recordId=null) → create
  └── 点行   → navigateToView('res.users.form', id)  → FormRenderer(recordId=id)   → update
```

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `packages/admin/src/types.ts` | Modify | `editRecordId`, `navigateToView` 加入 AppState |
| `packages/admin/src/store.ts` | Modify | 实现 `navigateToView`，加 `editRecordId` 状态 |
| `packages/admin/src/components/TableRenderer.tsx` | Modify | 加 `onNewClick`, `onRowClick` props |
| `packages/admin/src/components/ViewRenderer.tsx` | Modify | TreeCrudPage 分支逻辑，传 recordId |
| `packages/admin/src/components/FormRenderer.tsx` | Modify | 收 `recordId`，加载/提交数据 |
| `packages/admin/src/hooks/useCrud.ts` | Modify | 加 `fetchOne` |

**不需要改 tree view 文件** — form view id 由 model 名推导，`editable` 已存在。
