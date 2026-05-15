import type { ViewSpec } from '@erp/admin';

export const userForm: ViewSpec = {
  id: 'res.users.form',
  model: 'res.users',
  type: 'form',
  title: 'User',
  fields: [
    { name: 'name', label: 'Name', widget: 'text', required: true },
    { name: 'login', label: 'Login', widget: 'text', required: true },
    { name: 'password', label: 'Password', widget: 'text' },
    { name: 'email', label: 'Email', widget: 'text' },
    { name: 'active', label: 'Active', widget: 'text' },
    { name: 'groups', label: 'Groups', widget: 'text' },
  ],
  layout: {
    type: 'tabs',
    items: [
      { title: 'General', fields: ['name', 'login', 'active'] },
      { title: 'Contact', fields: ['email'] },
      { title: 'Security', fields: ['password', 'groups'] },
    ],
  },
};
