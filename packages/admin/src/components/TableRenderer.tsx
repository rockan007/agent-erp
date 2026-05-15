import React from 'react';
import { Table, Grid } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { InboxOutlined } from '@ant-design/icons';
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
    <div className="erp-table">
      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        locale={{ emptyText: (
          <div className="erp-empty-state">
            <InboxOutlined className="text-3xl text-[#d8d3ca] mb-3 block" />
            <div className="text-sm font-medium text-[#6b726e]">No records found</div>
            <div className="text-xs text-[#9e9890] mt-1">Create your first record to get started</div>
          </div>
        )}}
        size="middle"
        scroll={!screens.md ? { x: 'max-content' } : undefined}
        pagination={false}
      />
    </div>
  );
};
