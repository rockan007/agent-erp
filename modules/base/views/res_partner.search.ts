import type { ViewSpec } from '@erp/admin';

export const partnerSearch: ViewSpec = {
  id: 'res.partner.search',
  model: 'res.partner',
  type: 'search',
  title: 'Search Partners',
  fields: [
    { name: 'name', label: 'Name' },
    { name: 'email', label: 'Email' },
    { name: 'phone', label: 'Phone' },
    { name: 'company_type', label: 'Type' },
  ],
};
