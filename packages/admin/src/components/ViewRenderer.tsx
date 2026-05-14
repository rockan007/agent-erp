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
    default:
      return <div>Unknown view type: {view.type}</div>;
  }
};
