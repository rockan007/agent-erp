import React from 'react';
import { ViewSpec } from '../store';
import { FormRenderer } from './FormRenderer';
import { TableRenderer } from './TableRenderer';
import { SearchPanel } from './SearchPanel';

interface Props {
  view: ViewSpec;
}

export const ViewRenderer: React.FC<Props> = ({ view }) => {
  switch (view.type) {
    case 'form':
      return <FormRenderer view={view} />;
    case 'tree':
      return <TableRenderer view={view} />;
    case 'search':
      return <SearchPanel view={view} />;
    case 'kanban':
      return <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>Kanban view — coming soon</div>;
    case 'calendar':
      return <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>Calendar view — coming soon</div>;
    default:
      return <div>Unknown view type: {view.type}</div>;
  }
};
