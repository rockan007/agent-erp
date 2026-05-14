import React from 'react';
import { Typography, Space } from 'antd';
import { ViewSpec } from '../store';

const { Title } = Typography;

interface Props {
  view: ViewSpec;
}

export const PageHeader: React.FC<Props> = ({ view }) => {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white">
      <Title level={4} className="!mb-0">{view.title}</Title>
      <Space>
        {/* Action buttons extensible via ViewSpec.actions in future */}
      </Space>
    </div>
  );
};
