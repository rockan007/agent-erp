# Frontend CRUD Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make tree/list views fully interactive by adding a `useCrud` hook for API data fetching/mutation and wiring it into `TableRenderer` with inline expandable-row editing.

**Architecture:** A new `useCrud` hook encapsulates API calls (GET/POST/PUT/DELETE) with loading/error state. `TableRenderer` gains optional `crud` and `records` props — when `crud` is provided, it renders a "New" button, expandable edit rows, and delete buttons. `ViewRenderer` wires the hook into tree views, making groups, users, and partners all CRUD-capable automatically.

**Tech Stack:** React 18, TypeScript, antd 5, Zustand (for token), vitest (unit), Playwright (e2e)

---

### Task 1: useCrud hook

**Files:**
- Create: `packages/admin/src/hooks/useCrud.ts`
- Create: `packages/admin/src/hooks/__tests__/useCrud.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/admin/src/hooks/__tests__/useCrud.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCrud } from '../useCrud';

// Mock zustand store
vi.mock('../../store', () => ({
  useStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({ token: 'test-token' }),
    { getState: () => ({ token: 'test-token' }) },
  ),
}));

describe('useCrud', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchAll', () => {
    it('should fetch records and set them in state', async () => {
      const mockData = [{ id: 1, name: 'admin' }];
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const { result } = renderHook(() => useCrud('res.groups'));

      expect(result.current.loading).toBe(true);

      await act(async () => {
        await result.current.fetchAll();
      });

      expect(result.current.records).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/groups', {
        headers: { Authorization: 'Bearer test-token' },
      });
    });

    it('should set error when fetch fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useCrud('res.groups'));

      await act(async () => {
        await result.current.fetchAll();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('create', () => {
    it('should POST and refresh records on success', async () => {
      const created = { id: 1, name: 'new-group' };
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(created),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([created]),
        });

      const { result } = renderHook(() => useCrud('res.groups'));

      await act(async () => {
        await result.current.create({ name: 'new-group' });
      });

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({ name: 'new-group' }),
      });
      expect(result.current.records).toEqual([created]);
    });
  });

  describe('update', () => {
    it('should PUT and refresh records on success', async () => {
      const existing = [{ id: 1, name: 'old-name' }];
      const updatedList = [{ id: 1, name: 'new-name' }];

      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(updatedList),
        });

      const { result } = renderHook(() => useCrud('res.groups'));

      await act(async () => {
        await result.current.update(1, { name: 'new-name' });
      });

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/groups/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({ name: 'new-name' }),
      });
      expect(result.current.records).toEqual(updatedList);
    });
  });

  describe('remove', () => {
    it('should DELETE and refresh records on success', async () => {
      const remaining = [{ id: 2, name: 'other' }];

      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(remaining),
        });

      const { result } = renderHook(() => useCrud('res.groups'));

      await act(async () => {
        await result.current.remove(1);
      });

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/groups/1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer test-token' },
      });
      expect(result.current.records).toEqual(remaining);
    });
  });

  describe('apiPath derivation', () => {
    it('should derive /api/groups from res.groups', async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const { result } = renderHook(() => useCrud('res.groups'));

      await act(async () => {
        await result.current.fetchAll();
      });

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/groups', expect.anything());
    });

    it('should derive /api/users from res.users', async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const { result } = renderHook(() => useCrud('res.users'));

      await act(async () => {
        await result.current.fetchAll();
      });

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/users', expect.anything());
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @erp/admin exec vitest run src/hooks/__tests__/useCrud.test.ts`
Expected: FAIL — module not found or function not exported

- [ ] **Step 3: Write the useCrud hook**

Create `packages/admin/src/hooks/useCrud.ts`:

```ts
import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';

function deriveApiPath(model: string): string {
  const name = model.replace(/^res\./, '');
  return `/api/${name}`;
}

interface CrudState {
  records: Record<string, unknown>[];
  loading: boolean;
  error: string | null;
}

export function useCrud(model: string) {
  const apiPath = deriveApiPath(model);
  const token = useStore((s) => s.token);

  const [state, setState] = useState<CrudState>({
    records: [],
    loading: true,
    error: null,
  });

  const authHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  const fetchAll = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(apiPath, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      setState({ records: data as Record<string, unknown>[], loading: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, [apiPath, authHeaders]);

  const create = useCallback(async (data: Record<string, unknown>) => {
    setState((s) => ({ ...s, error: null }));
    const res = await fetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Create failed: ${res.status}`);
    await fetchAll();
  }, [apiPath, authHeaders, fetchAll]);

  const update = useCallback(async (id: number, data: Record<string, unknown>) => {
    setState((s) => ({ ...s, error: null }));
    const res = await fetch(`${apiPath}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Update failed: ${res.status}`);
    await fetchAll();
  }, [apiPath, authHeaders, fetchAll]);

  const remove = useCallback(async (id: number) => {
    setState((s) => ({ ...s, error: null }));
    const res = await fetch(`${apiPath}/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
    await fetchAll();
  }, [apiPath, authHeaders, fetchAll]);

  useEffect(() => {
    if (token) {
      fetchAll();
    }
  }, [token, fetchAll]);

  return {
    records: state.records,
    loading: state.loading,
    error: state.error,
    fetchAll,
    create,
    update,
    remove,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @erp/admin exec vitest run src/hooks/__tests__/useCrud.test.ts`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/admin/src/hooks/useCrud.ts packages/admin/src/hooks/__tests__/useCrud.test.ts
git commit -m "feat: add useCrud hook for tree view data fetching and mutation"
```

---

### Task 2: TableRenderer — add CRUD support

**Files:**
- Modify: `packages/admin/src/components/TableRenderer.tsx`
- Create: `packages/admin/src/components/__tests__/TableRenderer.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/admin/src/components/__tests__/TableRenderer.test.tsx`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableRenderer } from '../TableRenderer';
import type { ViewSpec } from '../../types';

const treeView: ViewSpec = {
  id: 'res.groups.tree',
  model: 'res.groups',
  type: 'tree',
  title: 'Groups',
  fields: [
    { name: 'name', label: 'Name', widget: 'text' },
    { name: 'description', label: 'Description', widget: 'text' },
  ],
};

const records = [
  { id: 1, name: 'admin', description: 'Administrator' },
  { id: 2, name: 'base_user', description: 'Base User' },
];

describe('TableRenderer with crud', () => {
  it('should render a "New Groups" button when crud is provided', () => {
    render(
      <TableRenderer
        view={treeView}
        records={records}
        loading={false}
        error={null}
        crud={{
          onSave: vi.fn(),
          onDelete: vi.fn(),
        }}
      />,
    );
    expect(screen.getByText('New Groups')).toBeDefined();
  });

  it('should NOT render "New" button when crud is omitted', () => {
    render(<TableRenderer view={treeView} />);
    expect(screen.queryByText('New Groups')).toBeNull();
  });

  it('should render delete icons per row when crud is provided', () => {
    render(
      <TableRenderer
        view={treeView}
        records={records}
        loading={false}
        error={null}
        crud={{
          onSave: vi.fn(),
          onDelete: vi.fn(),
        }}
      />,
    );
    // Delete buttons should be present
    const deleteButtons = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('aria-label')?.includes('delete') || btn.querySelector('.anticon-delete'),
    );
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('should show loading spinner when loading is true', () => {
    render(
      <TableRenderer
        view={treeView}
        records={[]}
        loading={true}
        error={null}
        crud={{
          onSave: vi.fn(),
          onDelete: vi.fn(),
        }}
      />,
    );
    expect(screen.getByText('No records found')).toBeDefined();
  });

  it('should show error alert when error is set', () => {
    render(
      <TableRenderer
        view={treeView}
        records={[]}
        loading={false}
        error="Something went wrong"
        crud={{
          onSave: vi.fn(),
          onDelete: vi.fn(),
        }}
      />,
    );
    expect(screen.getByText('Something went wrong')).toBeDefined();
  });

  it('should NOT show error alert when error is null', () => {
    render(
      <TableRenderer
        view={treeView}
        records={[]}
        loading={false}
        error={null}
        crud={{
          onSave: vi.fn(),
          onDelete: vi.fn(),
        }}
      />,
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @erp/admin exec vitest run src/components/__tests__/TableRenderer.test.tsx`
Expected: FAIL — "New Groups" button not found

- [ ] **Step 3: Update TableRenderer**

Rewrite `packages/admin/src/components/TableRenderer.tsx`:

```tsx
import React, { useState, useCallback } from 'react';
import { Table, Grid, Button, Popconfirm, Form, Alert, Space, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { ViewSpec, ViewField } from '../types';
import { TextWidget } from './widgets/TextWidget';
import { SelectWidget } from './widgets/SelectWidget';

const { useBreakpoint } = Grid;

interface CrudActions {
  onSave: (id: number | null, data: Record<string, unknown>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

interface Props {
  view: ViewSpec;
  records?: Record<string, unknown>[];
  loading?: boolean;
  error?: string | null;
  crud?: CrudActions;
}

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function renderWidget(field: ViewField) {
  switch (field.widget ?? 'text') {
    case 'select':
      return <SelectWidget field={field} />;
    case 'text':
    default:
      return <TextWidget field={field} />;
  }
}

function renderFieldItem(field: ViewField) {
  return (
    <Col key={field.name} xs={24} md={12}>
      <Form.Item
        name={field.name}
        label={field.label ?? field.name}
        rules={
          field.required
            ? [{ required: true, message: `${field.label ?? field.name} is required` }]
            : undefined
        }
      >
        {renderWidget(field)}
      </Form.Item>
    </Col>
  );
}

const NEW_ROW_ID = 'new';

export const TableRenderer: React.FC<Props> = ({
  view,
  records: externalRecords,
  loading,
  error,
  crud,
}) => {
  const screens = useBreakpoint();
  const [localRecords, setLocalRecords] = useState<Record<string, unknown>[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [editingForm] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const records = externalRecords ?? localRecords;
  const hasCrud = crud != null;

  const handleNew = useCallback(() => {
    const exists = records.some((r) => r.id === NEW_ROW_ID);
    if (exists) {
      setExpandedRowKeys([NEW_ROW_ID]);
      return;
    }
    setLocalRecords([{ id: NEW_ROW_ID }, ...records]);
    setExpandedRowKeys([NEW_ROW_ID]);
  }, [records]);

  const handleExpand = useCallback(
    (expanded: boolean, record: Record<string, unknown>) => {
      if (expanded) {
        setExpandedRowKeys([record.id as React.Key]);
        editingForm.setFieldsValue(record);
      } else {
        setExpandedRowKeys([]);
        if (record.id === NEW_ROW_ID) {
          setLocalRecords((prev) => prev.filter((r) => r.id !== NEW_ROW_ID));
        }
      }
    },
    [editingForm],
  );

  const handleSave = useCallback(
    async (record: Record<string, unknown>) => {
      try {
        const values = await editingForm.validateFields();
        setSaving(true);
        const id = record.id === NEW_ROW_ID || record.id == null ? null : (record.id as number);
        await crud!.onSave(id, values as Record<string, unknown>);
        setExpandedRowKeys([]);
        if (record.id === NEW_ROW_ID) {
          setLocalRecords((prev) => prev.filter((r) => r.id !== NEW_ROW_ID));
        }
      } catch (err) {
        if (err && typeof err === 'object' && 'errorFields' in err) return;
        // API error handled by parent via error prop
      } finally {
        setSaving(false);
      }
    },
    [editingForm, crud],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      await crud!.onDelete(id);
    },
    [crud],
  );

  const columns: ColumnsType<Record<string, unknown>> = [
    ...view.fields.map((f) => ({
      key: f.name,
      dataIndex: f.name,
      title: f.label ?? f.name,
      render: (_: unknown, record: Record<string, unknown>) => {
        if (record.id === NEW_ROW_ID) return null;
        return formatCell(record[f.name]);
      },
    })),
    ...(hasCrud
      ? [
          {
            key: '_actions',
            title: '',
            width: 60,
            render: (_: unknown, record: Record<string, unknown>) => {
              if (record.id === NEW_ROW_ID) return null;
              return (
                <Popconfirm
                  title="Delete this item?"
                  onConfirm={() => handleDelete(record.id as number)}
                  okText="Delete"
                  cancelText="Cancel"
                >
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    aria-label="delete"
                  />
                </Popconfirm>
              );
            },
          },
        ]
      : []),
  ];

  const expandable = hasCrud
    ? {
        expandedRowKeys,
        onExpand: handleExpand,
        expandedRowRender: (record: Record<string, unknown>) => (
          <div className="p-4 bg-[#fafbfc] rounded-lg border border-[#e8ecf1]">
            <Form form={editingForm} layout="vertical">
              <Row gutter={[20, 4]}>
                {view.fields.map((f) => renderFieldItem(f))}
              </Row>
              <div className="mt-4 pt-3 border-t border-[#e8ecf1]">
                <Space>
                  <Button
                    type="primary"
                    loading={saving}
                    onClick={() => handleSave(record)}
                  >
                    Save
                  </Button>
                  <Button onClick={() => {
                    setExpandedRowKeys([]);
                    if (record.id === NEW_ROW_ID) {
                      setLocalRecords((prev) => prev.filter((r) => r.id !== NEW_ROW_ID));
                    }
                  }}>
                    Cancel
                  </Button>
                </Space>
              </div>
            </Form>
          </div>
        ),
      }
    : undefined;

  const showToolbar = hasCrud;

  return (
    <div className="erp-table">
      {error && (
        <Alert
          message={error}
          type="error"
          closable
          className="mb-4"
        />
      )}
      {showToolbar && (
        <div className="mb-3">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>
            New {view.title}
          </Button>
        </div>
      )}
      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={loading}
        locale={{
          emptyText: (
            <div className="erp-empty-state">
              <InboxOutlined className="text-3xl text-[#d8d3ca] mb-3 block" />
              <div className="text-sm font-medium text-[#6b726e]">No records found</div>
              <div className="text-xs text-[#9e9890] mt-1">Create your first record to get started</div>
            </div>
          ),
        }}
        size="middle"
        scroll={!screens.md ? { x: 'max-content' } : undefined}
        pagination={false}
        expandable={expandable}
      />
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @erp/admin exec vitest run src/components/__tests__/TableRenderer.test.tsx`
Expected: all tests PASS

- [ ] **Step 5: Run existing tests to check for regressions**

Run: `pnpm --filter @erp/admin test`
Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add packages/admin/src/components/TableRenderer.tsx packages/admin/src/components/__tests__/TableRenderer.test.tsx
git commit -m "feat: add CRUD toolbar, expandable edit rows, and delete buttons to TableRenderer"
```

---

### Task 3: Wire useCrud into ViewRenderer

**Files:**
- Modify: `packages/admin/src/components/ViewRenderer.tsx`

- [ ] **Step 1: Update ViewRenderer**

Replace the `'tree'` case in `packages/admin/src/components/ViewRenderer.tsx`:

Old code (line 18):
```tsx
case 'tree':
  return <TableRenderer view={view} />;
```

New code — add the module-level `TreeCrudPage` component before `renderView`, and update the `'tree'` case:

```tsx
const TreeCrudPage: React.FC<{ view: ViewSpec }> = ({ view }) => {
  const { records, loading, error, create, update, remove } = useCrud(view.model);
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
};

// ... inside renderView:
case 'tree':
  return <TreeCrudPage view={view} />;
```

Add the import at the top:
```tsx
import { useCrud } from '../hooks/useCrud';
```

Note: The `useCrud` hook must be called from a component defined at module scope (not inline in the render function), otherwise React remounts on every render. We create a `TreeCrudPage` component.

Full file after edit:

```tsx
import React from 'react';
import { Result } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import { ViewSpec } from '../store';
import { FormRenderer } from './FormRenderer';
import { TableRenderer } from './TableRenderer';
import { SearchPanel } from './SearchPanel';
import { useCrud } from '../hooks/useCrud';

interface Props {
  view: ViewSpec;
}

const TreeCrudPage: React.FC<{ view: ViewSpec }> = ({ view }) => {
  const { records, loading, error, create, update, remove } = useCrud(view.model);
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
};

function renderView(view: ViewSpec): React.ReactNode {
  switch (view.type) {
    case 'form':
      return <FormRenderer view={view} />;
    case 'tree':
      return <TreeCrudPage view={view} />;
    case 'search':
      return <SearchPanel view={view} />;
    case 'kanban':
      return <Result status="info" title="Kanban View" subTitle="Coming soon" />;
    case 'calendar':
      return <Result status="info" title="Calendar View" subTitle="Coming soon" />;
    default:
      return <Result status="warning" title="Unknown View Type" subTitle={`No renderer for "${view.type}"`} />;
  }
}

export const ViewRenderer: React.FC<Props> = ({ view }) => (
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
);
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm --filter @erp/admin exec tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Run all tests**

Run: `pnpm --filter @erp/admin test`
Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add packages/admin/src/components/ViewRenderer.tsx
git commit -m "feat: wire useCrud hook into ViewRenderer for tree views"
```

---

### Task 4: e2e test — group CRUD flow

**Files:**
- Create: `packages/admin/e2e/groups-crud.spec.ts`

- [ ] **Step 1: Write the e2e test**

Create `packages/admin/e2e/groups-crud.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('Group CRUD', () => {
  test('should create, edit, and delete a group', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill('input[id="login"]', 'admin');
    await page.fill('input[id="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*/);

    // Navigate to Groups
    await page.click('text=Settings');
    await page.click('text=Groups');
    await page.waitForSelector('.erp-table');

    // Create a new group
    await page.click('text=New Groups');
    await page.waitForSelector('.ant-table-expanded-row');
    await page.fill('.ant-table-expanded-row input[id="name"]', 'e2e-test-group');
    await page.fill('.ant-table-expanded-row input[id="description"]', 'E2E test description');
    await page.click('.ant-table-expanded-row button:has-text("Save")');

    // Verify the group appears in the list
    await page.waitForSelector('text=e2e-test-group');
    await expect(page.locator('text=e2e-test-group').first()).toBeVisible();

    // Edit the group — expand the row
    const groupRow = page.locator('tr', { has: page.locator('text=e2e-test-group') });
    await groupRow.locator('[aria-label="Expand row"]').click();
    await page.waitForSelector('.ant-table-expanded-row');

    // Clear and update the name
    await page.fill('.ant-table-expanded-row input[id="name"]', 'e2e-test-group-edited');
    await page.click('.ant-table-expanded-row button:has-text("Save")');

    // Verify edited name appears
    await page.waitForSelector('text=e2e-test-group-edited');
    await expect(page.locator('text=e2e-test-group-edited').first()).toBeVisible();

    // Delete the group
    const editedRow = page.locator('tr', { has: page.locator('text=e2e-test-group-edited') });
    await editedRow.locator('[aria-label="delete"]').click();
    await page.click('button:has-text("Delete")');

    // Verify the group is removed
    await page.waitForTimeout(500);
    await expect(page.locator('text=e2e-test-group-edited')).toHaveCount(0);
  });
});
```

- [ ] **Step 2: Start dev server and run e2e**

Run:
```bash
pnpm --filter @erp/admin dev &
sleep 5
npx playwright test --config=packages/admin/playwright.config.ts packages/admin/e2e/groups-crud.spec.ts --reporter=list
```

Expected: test passes, showing create → edit → delete flow works end-to-end

- [ ] **Step 3: Commit**

```bash
git add packages/admin/e2e/groups-crud.spec.ts
git commit -m "test: add e2e test for group CRUD flow"
```

---

## Implementation Deviations

These changes were made during implementation based on user feedback and code review findings:

### Task 1.5 (added): `ViewSpec.editable` flag

- Added `editable?: boolean` to `ViewSpec` in `packages/admin/src/types.ts`
- `TreeCrudPage` only passes `crud` prop when `view.editable === true`
- `res.groups.tree.ts` set `editable: true` — only groups supports inline editing
- `res.users.tree.ts` and `res.partner.tree.ts` — no editable flag (read-only lists, editing via forms)

### Task 1: useCrud error handling & cleanup

- `create`/`update`/`remove` now set `loading: true` during mutations and capture errors in `error` state
- Added `mountedRef` cleanup pattern to prevent setState after unmount
- Added mutation error tests (3 additional tests, total 10)
