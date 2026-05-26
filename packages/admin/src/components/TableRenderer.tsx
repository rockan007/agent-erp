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

interface ExpandedRowContentProps {
  view: ViewSpec;
  editingForm: ReturnType<typeof Form.useForm>[0];
  saving: boolean;
  record: Record<string, unknown>;
  onSave: (record: Record<string, unknown>) => void;
  onCancel: (record: Record<string, unknown>) => void;
}

const ExpandedRowContent: React.FC<ExpandedRowContentProps> = ({
  view,
  editingForm,
  saving,
  record,
  onSave,
  onCancel,
}) => (
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
            onClick={() => onSave(record)}
          >
            Save
          </Button>
          <Button onClick={() => onCancel(record)}>
            Cancel
          </Button>
        </Space>
      </div>
    </Form>
  </div>
);

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

  const handleCancel = useCallback(
    (record: Record<string, unknown>) => {
      setExpandedRowKeys([]);
      if (record.id === NEW_ROW_ID) {
        setLocalRecords((prev) => prev.filter((r) => r.id !== NEW_ROW_ID));
      }
    },
    [],
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

  const expandedRowRender = useCallback(
    (record: Record<string, unknown>) => (
      <ExpandedRowContent
        view={view}
        editingForm={editingForm}
        saving={saving}
        record={record}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    ),
    [view, editingForm, saving, handleSave, handleCancel],
  );

  const expandable = hasCrud
    ? {
        expandedRowKeys,
        onExpand: handleExpand,
        expandedRowRender,
      }
    : undefined;

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
      {hasCrud && (
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
