import React from 'react';
import { Result } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import { ViewSpec } from '../store';
import { FormRenderer } from './FormRenderer';
import { TableRenderer } from './TableRenderer';
import { SearchPanel } from './SearchPanel';

interface Props {
  view: ViewSpec;
}

function renderView(view: ViewSpec): React.ReactNode {
  switch (view.type) {
    case 'form':
      return <FormRenderer view={view} />;
    case 'tree':
      return <TableRenderer view={view} />;
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
