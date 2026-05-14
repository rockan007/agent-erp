import React from 'react';
import { Typography, Space } from 'antd';
import { ViewSpec } from '../store';

const { Title } = Typography;

interface Props {
  view: ViewSpec;
}

export const PageHeader: React.FC<Props> = ({ view }) => {
  return (
    <div className="erp-page-header flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="w-1 h-5 rounded-full bg-[#1890ff]" />
        <Title level={5} className="!mb-0 text-[#1a1f1c] tracking-tight">
          {view.title}
        </Title>
      </div>
      <Space>{/* Action buttons area */}</Space>
    </div>
  );
};
