import type { ViewSpec } from '@erp/admin';

export const partnerForm: ViewSpec = {
  id: 'res.partner.form',
  model: 'res.partner',
  type: 'form',
  title: 'Partner',
  fields: [
    { name: 'name', label: 'Name', widget: 'text', required: true },
    { name: 'company_type', label: 'Type', widget: 'select', options: {
      choices: [['company', 'Company'], ['individual', 'Individual']],
    }},
    { name: 'email', label: 'Email', widget: 'text' },
    { name: 'phone', label: 'Phone', widget: 'text' },
    { name: 'website', label: 'Website', widget: 'text' },
    { name: 'vat', label: 'VAT', widget: 'text' },
    { name: 'active', label: 'Active', widget: 'text' },
    { name: 'comment', label: 'Notes', widget: 'text' },
  ],
  layout: {
    type: 'tabs',
    items: [
      { title: 'General', fields: ['name', 'company_type', 'active'] },
      { title: 'Contact', fields: ['email', 'phone', 'website'] },
      { title: 'Finance', fields: ['vat'] },
      { title: 'Notes', fields: ['comment'] },
    ],
  },
};
