import React from 'react';
import { Form, Input, Button, Space, Typography } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { ViewSpec } from '../store';

const { Title } = Typography;

interface Props {
  view: ViewSpec;
}

export const SearchPanel: React.FC<Props> = ({ view }) => {
  const [form] = Form.useForm();

  const handleSearch = (values: Record<string, string>) => {
    // Dispatch search with current filters
    console.log('Search:', view.model, values);
  };

  const handleClear = () => {
    form.resetFields();
  };

  return (
    <div>
      <Title level={3}>Search: {view.model}</Title>
      <Form
        form={form}
        layout="inline"
        onFinish={handleSearch}
        className="flex-wrap gap-3 mb-4"
      >
        {view.fields.map((f) => (
          <Form.Item key={f.name} name={f.name} label={f.label ?? f.name}>
            <Input placeholder={f.label ?? f.name} allowClear />
          </Form.Item>
        ))}
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              Search
            </Button>
            <Button onClick={handleClear} icon={<ClearOutlined />}>
              Clear
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};
