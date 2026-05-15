import type { ViewSpec } from '@erp/admin';

export const groupForm: ViewSpec = {
  id: 'res.groups.form',
  model: 'res.groups',
  type: 'form',
  title: 'Group',
  fields: [
    { name: 'name', label: 'Name', widget: 'text', required: true },
    { name: 'description', label: 'Description', widget: 'text' },
  ],
};
