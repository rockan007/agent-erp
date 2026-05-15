import type { ViewSpec } from '@erp/admin';

export const userTree: ViewSpec = {
  id: 'res.users.tree',
  model: 'res.users',
  type: 'tree',
  title: 'Users',
  fields: [
    { name: 'name', label: 'Name', widget: 'text' },
    { name: 'login', label: 'Login', widget: 'text' },
    { name: 'email', label: 'Email', widget: 'text' },
    { name: 'active', label: 'Active', widget: 'text' },
  ],
};
