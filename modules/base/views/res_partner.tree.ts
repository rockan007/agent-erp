import type { ViewSpec } from '@erp/admin';

export const partnerTree: ViewSpec = {
  id: 'res.partner.tree',
  model: 'res.partner',
  type: 'tree',
  title: 'Partners',
  fields: [
    { name: 'name', label: 'Name', widget: 'text' },
    { name: 'company_type', label: 'Type', widget: 'text' },
    { name: 'email', label: 'Email', widget: 'text' },
    { name: 'phone', label: 'Phone', widget: 'text' },
    { name: 'active', label: 'Active', widget: 'text' },
  ],
};
