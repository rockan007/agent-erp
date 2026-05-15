import React from 'react';
import { Form, Input, Select, Button, Tabs, Card, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { ViewSpec, ViewField } from '../store';

interface Props {
  view: ViewSpec;
}

function renderWidget(field: ViewField) {
  const widget = field.widget ?? 'text';
  switch (widget) {
    case 'select':
      return <Select placeholder="-- Select --" allowClear />;
    case 'text':
    default:
      return <Input />;
  }
}

function renderFields(fieldNames: string[], fields: ViewField[]) {
  return fieldNames.map((fieldName) => {
    const fieldDef = fields.find((f) => f.name === fieldName);
    if (!fieldDef) return null;
    return (
      <Form.Item
        key={fieldName}
        name={fieldName}
        label={fieldDef.label ?? fieldDef.name}
        rules={
          fieldDef.required
            ? [{ required: true, message: `${fieldDef.label ?? fieldDef.name} is required` }]
            : undefined
        }
      >
        {renderWidget(fieldDef)}
      </Form.Item>
    );
  });
}

function renderFlatFields(fields: ViewField[]) {
  return fields.map((f) => (
    <Form.Item
      key={f.name}
      name={f.name}
      label={f.label ?? f.name}
      rules={f.required ? [{ required: true, message: `${f.label ?? f.name} is required` }] : undefined}
    >
      {renderWidget(f)}
    </Form.Item>
  ));
}

export const FormRenderer: React.FC<Props> = ({ view }) => {
  const [form] = Form.useForm();

  const handleSave = (values: Record<string, unknown>) => {
    console.log('Save:', view.model, values);
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
                <div className="pt-2">{renderFields(item.fields, view.fields)}</div>
              ),
            }))}
          />
        );
      case 'grid':
        return (
          <Row gutter={[16, 16]}>
            {view.layout.items.map((item, i) => (
              <Col key={i} span={24 / view.layout!.items.length}>
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="erp-form-card">
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {renderContent()}
          <div className="mt-6 pt-5 border-t border-[#e8e3da]">
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="middle">
              Save
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};
