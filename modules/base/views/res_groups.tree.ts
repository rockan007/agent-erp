import type { ViewSpec } from '@erp/admin';

export const groupTree: ViewSpec = {
  id: 'res.groups.tree',
  model: 'res.groups',
  type: 'tree',
  title: 'Groups',
  fields: [
    { name: 'name', label: 'Name', widget: 'text' },
    { name: 'description', label: 'Description', widget: 'text' },
  ],
  editable: true,
};
