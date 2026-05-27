import React from 'react';
import { Breadcrumb } from 'antd';
import { ViewSpec, useStore } from '../store';

interface Props {
  view: ViewSpec;
}

export const PageHeader: React.FC<Props> = ({ view: _view }) => {
  const breadcrumbs = useStore((s) => s.breadcrumbs);
  const selectMenu = useStore((s) => s.selectMenu);
  const navigateToView = useStore((s) => s.navigateToView);

  const breadcrumbItems = breadcrumbs.length > 0
    ? breadcrumbs.map((b) => {
        const hasAction = b.menuId || b.viewId;
        if (!hasAction) {
          return { title: <span>{b.name}</span> };
        }
        return {
          title: (
            <button
              type="button"
              onClick={() => {
                if (b.menuId) {
                  selectMenu(b.menuId);
                } else if (b.viewId) {
                  navigateToView(b.viewId);
                }
              }}
            >
              {b.name}
            </button>
          ),
        };
      })
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
