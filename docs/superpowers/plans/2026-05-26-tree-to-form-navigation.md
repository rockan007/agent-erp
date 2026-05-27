# Tree-to-Form Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Non-editable tree views (users, partners) navigate to form views for create/edit via a "New" button and clickable rows.

**Architecture:** The `editable` flag remains the single switch — `editable: true` keeps inline CRUD, otherwise the tree shows navigation controls. Form view ID is derived from the model name (`${model}.form`). Navigation flows through the Zustand store's new `navigateToView(viewId, recordId?)` action, which sets `activeView` and `editRecordId`. `FormRenderer` reads `recordId` to decide whether to load existing data for editing or show an empty form for creation.

**Tech Stack:** React 18, TypeScript, antd 5, Zustand, vitest

---

### Task 1: Add `editRecordId` and `navigateToView` to types

**Files:**
- Modify: `packages/admin/src/types.ts`

- [ ] **Step 1: Add `editRecordId` state and `navigateToView` action to `AppState`**

Add two new members to the `AppState` interface in `packages/admin/src/types.ts`, right after `viewsMap` (line 55) and before `setMenuItems` (line 57):

```ts
  editRecordId: number | null;
  navigateToView: (viewId: string, recordId?: number) => void;
```

The full `AppState` interface now has these additions between `viewsMap` and `setMenuItems`:

```ts
export interface AppState {
  // ... existing members (lines 47-55) ...
  viewsMap: Record<string, ViewSpec>;
  editRecordId: number | null;
  navigateToView: (viewId: string, recordId?: number) => void;

  setMenuItems: (items: MenuItem[]) => void;
  // ... rest unchanged ...
}
```

- [ ] **Step 2: Type-check to verify**

Run: `pnpm --filter @erp/admin exec tsc --noEmit`
Expected: FAIL — `store.ts` will complain that `editRecordId` and `navigateToView` are missing from the store implementation. This is expected; we add them in Task 2.

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/types.ts
git commit -m "feat: add editRecordId and navigateToView to AppState type"
```

---

### Task 2: Implement `navigateToView` in store

**Files:**
- Modify: `packages/admin/src/store.ts`

- [ ] **Step 1: Add `editRecordId` initial state and `navigateToView` implementation**

In `packages/admin/src/store.ts`, add `editRecordId: null` to the initial state object (after `viewsMap: {}` on line 35):

```ts
  viewsMap: {},
  editRecordId: null,
```

Add the `navigateToView` action after `selectMenu` (after line 98):

```ts
  navigateToView: (viewId, recordId) => {
    const { viewsMap: vm } = get();
    const view = vm[viewId] ?? null;
    set({ activeView: view, editRecordId: recordId ?? null });
  },
```

- [ ] **Step 2: Type-check to verify**

Run: `pnpm --filter @erp/admin exec tsc --noEmit`
Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add packages/admin/src/store.ts
git commit -m "feat: implement navigateToView action in store"
```

---

### Task 3: Add `fetchOne` to `useCrud` hook

**Files:**
- Modify: `packages/admin/src/hooks/useCrud.ts`

- [ ] **Step 1: Add `fetchOne` method**

Add `fetchOne` to `useCrud` hook in `packages/admin/src/hooks/useCrud.ts`. Insert it after the `remove` callback (after line 119) and update the return statement (line 127):

```ts
  const fetchOne = useCallback(async (id: number): Promise<Record<string, unknown> | null> => {
    const res = await fetch(`${apiPath}/${id}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    return res.json() as Promise<Record<string, unknown>>;
  }, [apiPath, authHeaders]);
```

Update the return statement to include `fetchOne`:

```ts
  return {
    records: state.records,
    loading: state.loading,
    error: state.error,
    fetchAll,
    create,
    update,
    remove,
    fetchOne,
  };
```

- [ ] **Step 2: Type-check to verify**

Run: `pnpm --filter @erp/admin exec tsc --noEmit`
Expected: PASS (no errors)

- [ ] **Step 3: Run existing useCrud tests**

Run: `pnpm --filter @erp/admin exec vitest run src/hooks/__tests__/useCrud.test.ts`
Expected: All 10 existing tests still pass

- [ ] **Step 4: Commit**

```bash
git add packages/admin/src/hooks/useCrud.ts
git commit -m "feat: add fetchOne to useCrud hook"
```

---

### Task 4: Add `onNewClick` and `onRowClick` props to TableRenderer

**Files:**
- Modify: `packages/admin/src/components/TableRenderer.tsx`

- [ ] **Step 1: Add new props to the Props interface**

In `packages/admin/src/components/TableRenderer.tsx`, add `onNewClick` and `onRowClick` to the `Props` interface (after `crud?: CrudActions` on line 21):

```ts
interface Props {
  view: ViewSpec;
  records?: Record<string, unknown>[];
  loading?: boolean;
  error?: string | null;
  crud?: CrudActions;
  onNewClick?: () => void;
  onRowClick?: (record: Record<string, unknown>) => void;
}
```

- [ ] **Step 2: Destructure new props and add navigation toolbar**

In the destructuring of `TableRenderer` props (line 110-116), add the new props:

```tsx
export const TableRenderer: React.FC<Props> = ({
  view,
  records: externalRecords,
  loading,
  error,
  crud,
  onNewClick,
  onRowClick,
}) => {
```

Add a `hasNav` variable after `hasCrud` (line 129):

```ts
  const hasNav = onNewClick != null || onRowClick != null;
```

- [ ] **Step 3: Add "New" button for navigation mode**

After the `hasCrud` toolbar (lines 274-279), add a navigation-mode toolbar. Replace the existing toolbar block (lines 274-279):

```tsx
      {(hasCrud || hasNav) && (
        <div className="mb-3">
          {hasCrud && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>
              New {view.title}
            </Button>
          )}
          {!hasCrud && onNewClick && (
            <Button type="primary" icon={<PlusOutlined />} onClick={onNewClick}>
              New {view.title}
            </Button>
          )}
        </div>
      )}
```

- [ ] **Step 4: Make rows clickable when `onRowClick` is provided**

Replace the `<Table` component's opening tag to add `onRow`:

The `<Table` at line 281 becomes:

```tsx
      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={loading}
        locale={{...}}
        size="middle"
        scroll={!screens.md ? { x: 'max-content' } : undefined}
        pagination={false}
        expandable={expandable}
        onRow={onRowClick ? (record) => ({
          onClick: () => onRowClick(record),
          style: { cursor: 'pointer' },
        }) : undefined}
      />
```

- [ ] **Step 5: Type-check to verify**

Run: `pnpm --filter @erp admin exec tsc --noEmit`
Expected: PASS (no errors)

- [ ] **Step 6: Run existing TableRenderer tests**

Run: `pnpm --filter @erp/admin exec vitest run src/components/__tests__/TableRenderer.test.tsx`
Expected: All 7 existing tests still pass

- [ ] **Step 7: Commit**

```bash
git add packages/admin/src/components/TableRenderer.tsx
git commit -m "feat: add onNewClick and onRowClick navigation props to TableRenderer"
```

---

### Task 5: Update ViewRenderer — TreeCrudPage branch logic + pass recordId to FormRenderer

**Files:**
- Modify: `packages/admin/src/components/ViewRenderer.tsx`

- [ ] **Step 1: Import `useStore` and update `TreeCrudPage` with navigation branch**

Replace the entire `TreeCrudPage` component (lines 14-39) and the `renderView` function's `case 'form'` (line 44) and `case 'tree'` (line 46) in `packages/admin/src/components/ViewRenderer.tsx`.

First, add `useStore` to the imports (line 1-8). Replace the existing import for store:

```tsx
import { ViewSpec, useStore } from '../store';
```

Then replace `TreeCrudPage` (lines 14-39) with:

```tsx
const TreeCrudPage: React.FC<{ view: ViewSpec }> = ({ view }) => {
  const { records, loading, error, create, update, remove } = useCrud(view.model);
  const navigateToView = useStore((s) => s.navigateToView);

  if (view.editable) {
    return (
      <TableRenderer
        view={view}
        records={records}
        loading={loading}
        error={error}
        crud={{
          onSave: async (id, data) => {
            if (id != null) {
              await update(id, data);
            } else {
              await create(data);
            }
          },
          onDelete: async (id) => {
            await remove(id);
          },
        }}
      />
    );
  }

  const formViewId = `${view.model}.form`;
  return (
    <TableRenderer
      view={view}
      records={records}
      loading={loading}
      error={error}
      onNewClick={() => navigateToView(formViewId)}
      onRowClick={(record) => navigateToView(formViewId, record.id as number)}
    />
  );
};
```

- [ ] **Step 2: Update `case 'form'` in `renderView` to pass `recordId`**

Replace the `case 'form'` line (line 44) in `renderView`:

```tsx
    case 'form': {
      const editRecordId = useStore.getState().editRecordId;
      return <FormRenderer view={view} recordId={editRecordId} />;
    }
```

- [ ] **Step 3: Type-check to verify**

Run: `pnpm --filter @erp/admin exec tsc --noEmit`
Expected: FAIL — `FormRenderer` doesn't accept `recordId` prop yet. This is expected; we add it in Task 6.

- [ ] **Step 4: Commit**

```bash
git add packages/admin/src/components/ViewRenderer.tsx
git commit -m "feat: add tree-to-form navigation branch in ViewRenderer"
```

---

### Task 6: Update FormRenderer — accept recordId, load data, submit to API

**Files:**
- Modify: `packages/admin/src/components/FormRenderer.tsx`

- [ ] **Step 1: Add imports and update Props**

Add `useEffect` import. Replace the existing imports (lines 1-6) of `packages/admin/src/components/FormRenderer.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { Form, Button, Tabs, Card, Row, Col, Spin, Alert } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { ViewSpec, ViewField } from '../store';
import { useCrud } from '../hooks/useCrud';
import { TextWidget } from './widgets/TextWidget';
import { SelectWidget } from './widgets/SelectWidget';
```

Update the `Props` interface:

```tsx
interface Props {
  view: ViewSpec;
  recordId?: number | null;
}
```

- [ ] **Step 2: Add data loading and form submission logic**

Replace the `FormRenderer` component (lines 63-128) with:

```tsx
export const FormRenderer: React.FC<Props> = ({ view, recordId }) => {
  const [form] = Form.useForm();
  const { create, update, fetchOne } = useCrud(view.model);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recordId != null) {
      setLoading(true);
      setError(null);
      fetchOne(recordId)
        .then((data) => {
          if (data) form.setFieldsValue(data);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load record');
        })
        .finally(() => setLoading(false));
    } else {
      form.resetFields();
    }
  }, [recordId, form, fetchOne]);

  const handleSave = async (values: Record<string, unknown>) => {
    try {
      setError(null);
      if (recordId != null) {
        await update(recordId, values);
      } else {
        await create(values);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const renderContent = () => {
    // ... existing layout rendering unchanged ...
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {error && (
        <Alert message={error} type="error" closable className="mb-4" />
      )}
      <div className="erp-form-card">
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {renderContent()}
          <div className="mt-6 pt-5 border-t border-[#e8ecf1]">
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="middle">
              Save
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};
```

Note: The `renderContent` function (lines 70-111) remains exactly as-is — it renders fields based on `view.layout` and `view.fields`. Do not modify it.

- [ ] **Step 3: Type-check to verify**

Run: `pnpm --filter @erp/admin exec tsc --noEmit`
Expected: PASS (ViewRenderer's `recordId` prop now matches FormRenderer's updated Props)

- [ ] **Step 4: Run full test suite to check for regressions**

Run: `pnpm --filter @erp/admin exec vitest run`
Expected: All existing tests pass (useCrud 10 tests + TableRenderer 7 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/admin/src/components/FormRenderer.tsx
git commit -m "feat: wire FormRenderer to load and submit data via API"
```

---

### Task 7: Integration verification

**Files:**
- No file changes — verification only

- [ ] **Step 1: Full type-check**

Run: `pnpm --filter @erp/admin exec tsc --noEmit`
Expected: PASS

- [ ] **Step 2: Full test suite**

Run: `pnpm --filter @erp/admin exec vitest run`
Expected: All tests pass

- [ ] **Step 3: Verify form views exist for users and partners**

Confirm that `modules/base/views/` contains form view definitions for users and partners with matching IDs:

Run: `ls modules/base/views/res_users.form.ts modules/base/views/res_partner.form.ts`
Expected: Both files exist

- [ ] **Step 4: Commit any remaining changes**

Only if step 3 required adding form views:

```bash
git add modules/base/views/
git commit -m "feat: add form view definitions for users and partners"
```
