import React from 'react';
import { Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ViewSpec } from '../store';

const { Title } = Typography;

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

  const columns: ColumnsType<Record<string, unknown>> = view.fields.map((f) => ({
    key: f.name,
    dataIndex: f.name,
    title: f.label ?? f.name,
    render: (_: unknown, record: Record<string, unknown>) => formatCell(record[f.name]),
  }));

  return (
    <div>
      <Title level={3}>{view.title}</Title>
      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        locale={{ emptyText: 'No records found' }}
        bordered
        size="middle"
      />
    </div>
  );
};
