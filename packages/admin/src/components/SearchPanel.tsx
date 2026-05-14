import React from 'react';
import { Form, Input, Button, Space, Grid } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { ViewSpec } from '../store';

const { useBreakpoint } = Grid;

interface Props {
  view: ViewSpec;
}

export const SearchPanel: React.FC<Props> = ({ view }) => {
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const isNarrow = !screens.md;

  const handleSearch = (values: Record<string, string>) => {
    // Dispatch search with current filters
    console.log('Search:', view.model, values);
  };

  const handleClear = () => {
    form.resetFields();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Form
        form={form}
        layout={isNarrow ? 'vertical' : 'inline'}
        onFinish={handleSearch}
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
