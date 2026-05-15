import type { ViewSpec } from '@erp/admin';

export const userSearch: ViewSpec = {
  id: 'res.users.search',
  model: 'res.users',
  type: 'search',
  title: 'Search Users',
  fields: [
    { name: 'name', label: 'Name' },
    { name: 'login', label: 'Login' },
    { name: 'email', label: 'Email' },
  ],
};
