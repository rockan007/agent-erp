import React from 'react';
import { Form, Input, Button, Space } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { ViewSpec } from '../store';

interface Props {
  view: ViewSpec;
}

export const SearchPanel: React.FC<Props> = ({ view }) => {
  const [form] = Form.useForm();

  const handleSearch = (values: Record<string, string>) => {
    console.log('Search:', view.model, values);
  };

  const handleClear = () => {
    form.resetFields();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="erp-search-panel">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSearch}
        >
          <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
            {view.fields.map((f) => (
              <Form.Item key={f.name} name={f.name} label={f.label ?? f.name} className="!mb-0 min-w-[160px]">
                <Input placeholder={f.label ?? f.name} allowClear />
              </Form.Item>
            ))}
            <Form.Item className="!mb-0">
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  Search
                </Button>
                <Button onClick={handleClear} icon={<ClearOutlined />}>
                  Clear
                </Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </div>
    </div>
  );
};
