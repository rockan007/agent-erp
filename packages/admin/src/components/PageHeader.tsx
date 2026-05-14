import React from 'react';
import { Typography, Space, Breadcrumb } from 'antd';
import { ViewSpec, useStore } from '../store';

const { Title } = Typography;

interface Props {
  view: ViewSpec;
}

export const PageHeader: React.FC<Props> = ({ view }) => {
  const breadcrumbs = useStore((s) => s.breadcrumbs);

  const breadcrumbItems =
    breadcrumbs.length > 0
      ? breadcrumbs.map((b) => ({ title: b.name }))
      : [{ title: 'Home' }];

  return (
    <div className="erp-page-header px-6 py-3">
      <Breadcrumb
        items={breadcrumbItems}
        className="erp-page-breadcrumb"
      />
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 rounded-full bg-[#1890ff]" />
          <Title level={5} className="!mb-0 text-[#1a1f1c] tracking-tight">
            {view.title}
          </Title>
        </div>
        <Space>{/* Action buttons area */}</Space>
      </div>
    </div>
  );
};
