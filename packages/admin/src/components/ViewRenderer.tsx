import React from 'react';
import { Result } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import { ViewSpec } from '../store';
import { useCrud } from '../hooks/useCrud';
import { FormRenderer } from './FormRenderer';
import { TableRenderer } from './TableRenderer';
import { SearchPanel } from './SearchPanel';

interface Props {
  view: ViewSpec;
}

const TreeCrudPage: React.FC<{ view: ViewSpec }> = ({ view }) => {
  const { records, loading, error, create, update, remove } = useCrud(view.model);
  const crud = view.editable
    ? {
        onSave: async (id: number | null, data: Record<string, unknown>) => {
          if (id != null) {
            await update(id, data);
          } else {
            await create(data);
          }
        },
        onDelete: async (id: number) => {
          await remove(id);
        },
      }
    : undefined;
  return (
    <TableRenderer
      view={view}
      records={records}
      loading={loading}
      error={error}
      crud={crud}
    />
  );
};

function renderView(view: ViewSpec): React.ReactNode {
  switch (view.type) {
    case 'form':
      return <FormRenderer view={view} />;
    case 'tree':
      return <TreeCrudPage view={view} />;
    case 'search':
      return <SearchPanel view={view} />;
    case 'kanban':
      return <Result status="info" title="Kanban View" subTitle="Coming soon" />;
    case 'calendar':
      return <Result status="info" title="Calendar View" subTitle="Coming soon" />;
    default:
      return <Result status="warning" title="Unknown View Type" subTitle={`No renderer for "${view.type}"`} />;
  }
}

export const ViewRenderer: React.FC<Props> = ({ view }) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={view.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      {renderView(view)}
    </motion.div>
  </AnimatePresence>
);
