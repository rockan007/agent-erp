import React, { useEffect, useState } from 'react';
import { Form, Button, Tabs, Card, Row, Col, Spin, Alert, message } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { ViewSpec, ViewField, useStore } from '../store';
import { useCrud } from '../hooks/useCrud';
import { TextWidget } from './widgets/TextWidget';
import { SelectWidget } from './widgets/SelectWidget';

interface Props {
  view: ViewSpec;
  recordId?: number | null;
}

function renderWidget(field: ViewField) {
  const widget = field.widget ?? 'text';
  switch (widget) {
    case 'select':
      return <SelectWidget field={field} />;
    case 'text':
    default:
      return <TextWidget field={field} />;
  }
}

function renderFieldItem(fieldDef: ViewField) {
  return (
    <Col key={fieldDef.name} xs={24} md={12}>
      <Form.Item
        name={fieldDef.name}
        label={fieldDef.label ?? fieldDef.name}
        rules={
          fieldDef.required
            ? [{ required: true, message: `${fieldDef.label ?? fieldDef.name} is required` }]
            : undefined
        }
      >
        {renderWidget(fieldDef)}
      </Form.Item>
    </Col>
  );
}

function renderFields(fieldNames: string[], fields: ViewField[]) {
  const resolved = fieldNames
    .map((name) => fields.find((f) => f.name === name))
    .filter((f): f is ViewField => f != null);

  if (resolved.length === 0) return null;

  return (
    <Row gutter={[20, 4]}>
      {resolved.map((f) => renderFieldItem(f))}
    </Row>
  );
}

function renderFlatFields(fields: ViewField[]) {
  return (
    <Row gutter={[20, 4]}>
      {fields.map((f) => renderFieldItem(f))}
    </Row>
  );
}

export const FormRenderer: React.FC<Props> = ({ view, recordId }) => {
  const [form] = Form.useForm();
  const { create, update, fetchOne } = useCrud(view.model);
  const navigateToView = useStore((s) => s.navigateToView);
  const previousViewId = useStore((s) => s.previousViewId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (recordId != null) {
      setLoading(true);
      setError(null);
      fetchOne(recordId)
        .then((data) => {
          if (!ignore && data) form.setFieldsValue(data);
        })
        .catch((err) => {
          if (!ignore) setError(err instanceof Error ? err.message : 'Failed to load record');
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    } else {
      form.resetFields();
    }
    return () => { ignore = true; };
  }, [recordId, form, fetchOne]);

  const handleSave = async (values: Record<string, unknown>) => {
    try {
      setError(null);
      setSaving(true);
      if (recordId != null) {
        await update(recordId, values);
      } else {
        await create(values);
      }
      message.success(recordId != null ? 'Record updated' : 'Record created');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const renderContent = () => {
    if (!view.layout) {
      return renderFlatFields(view.fields);
    }

    switch (view.layout.type) {
      case 'tabs':
        return (
          <Tabs
            items={view.layout.items.map((item, i) => ({
              key: String(i),
              label: item.title,
              children: (
                <div className="pt-3">{renderFields(item.fields, view.fields)}</div>
              ),
            }))}
          />
        );
      case 'grid':
        return (
          <Row gutter={[16, 16]}>
            {view.layout.items.map((item, i) => (
              <Col key={i} xs={24} md={Math.max(12, Math.floor(24 / Math.min(view.layout!.items.length, 2)))}>
                <Card title={item.title} size="small" className="erp-card-elevated">
                  {renderFields(item.fields, view.fields)}
                </Card>
              </Col>
            ))}
          </Row>
        );
      case 'inline':
      default:
        return (
          <>
            {view.layout.items.map((item, i) => (
              <Card key={i} title={item.title} size="small" className="erp-card-elevated mb-4">
                {renderFields(item.fields, view.fields)}
              </Card>
            ))}
          </>
        );
    }
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
      {previousViewId && (
        <div className="mb-3">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigateToView(previousViewId)}
          >
            Back
          </Button>
        </div>
      )}
      {error && (
        <Alert message={error} type="error" closable className="mb-4" />
      )}
      <div className="erp-form-card">
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {renderContent()}
          <div className="mt-6 pt-5 border-t border-[#e8ecf1]">
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="middle" loading={saving}>
              Save
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};
