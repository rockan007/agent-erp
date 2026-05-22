import React from 'react';
import { Breadcrumb } from 'antd';
import { ViewSpec, useStore } from '../store';

interface Props {
  view: ViewSpec;
}

export const PageHeader: React.FC<Props> = ({ view: _view }) => {
  const breadcrumbs = useStore((s) => s.breadcrumbs);

  const breadcrumbItems = breadcrumbs.length > 0
    ? breadcrumbs.map((b) => ({ title: b.name }))
    : [{ title: 'Home' }];

  return (
    <div className="erp-content-breadcrumb">
      <Breadcrumb
        items={breadcrumbItems}
        className="erp-page-breadcrumb"
      />
    </div>
  );
};
