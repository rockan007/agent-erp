import React from 'react';
import { Result } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import { ViewSpec, useStore } from '../store';
import { useCrud } from '../hooks/useCrud';
import { FormRenderer } from './FormRenderer';
import { TableRenderer } from './TableRenderer';
import { SearchPanel } from './SearchPanel';

interface Props {
  view: ViewSpec;
}

const TreeCrudPage: React.FC<{ view: ViewSpec }> = ({ view }) => {
  const { records, loading, error, create, update, remove } = useCrud(view.model);
  const navigateToView = useStore((s) => s.navigateToView);

  if (view.editable) {
    return (
      <TableRenderer
        view={view}
        records={records}
        loading={loading}
        error={error}
        crud={{
          onSave: async (id, data) => {
            if (id != null) {
              await update(id, data);
            } else {
              await create(data);
            }
          },
          onDelete: async (id) => {
            await remove(id);
          },
        }}
      />
    );
  }

  const formViewId = `${view.model}.form`;
  return (
    <TableRenderer
      view={view}
      records={records}
      loading={loading}
      error={error}
      onNewClick={() => navigateToView(formViewId)}
      onRowClick={(record) => navigateToView(formViewId, record.id as number)}
    />
  );
};

function renderView(view: ViewSpec, editRecordId: number | null): React.ReactNode {
  switch (view.type) {
    case 'form':
      return <FormRenderer view={view} recordId={editRecordId} />;
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

export const ViewRenderer: React.FC<Props> = ({ view }) => {
  const editRecordId = useStore((s) => s.editRecordId);
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {renderView(view, editRecordId)}
      </motion.div>
    </AnimatePresence>
  );
};
