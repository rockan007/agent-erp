import React from 'react';
import { Table, Grid } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ViewSpec } from '../store';

const { useBreakpoint } = Grid;

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

interface Props {
  view: ViewSpec;
}

export const TableRenderer: React.FC<Props> = ({ view }) => {
  const [records] = React.useState<Record<string, unknown>[]>([]);
  const screens = useBreakpoint();

  const columns: ColumnsType<Record<string, unknown>> = view.fields.map((f) => ({
    key: f.name,
    dataIndex: f.name,
    title: f.label ?? f.name,
    render: (_: unknown, record: Record<string, unknown>) => formatCell(record[f.name]),
  }));

  return (
    <Table
      columns={columns}
      dataSource={records}
      rowKey="id"
      locale={{ emptyText: 'No records found' }}
      bordered
      size="middle"
      scroll={!screens.md ? { x: 'max-content' } : undefined}
    />
  );
};
