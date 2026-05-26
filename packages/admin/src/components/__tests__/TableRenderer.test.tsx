import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TableRenderer } from '../TableRenderer';
import type { ViewSpec } from '../../types';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

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
  afterEach(cleanup);

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
        loading
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
