import type { MenuItem } from '@erp/admin';

export const baseMenus: MenuItem[] = [
  {
    id: 'contacts_root',
    name: 'Contacts',
    sequence: 10,
  },
  {
    id: 'partner_menu',
    name: 'Partners',
    sequence: 10,
    parentId: 'contacts_root',
    action: 'res.partner.tree',
  },
  {
    id: 'settings_root',
    name: 'Settings',
    sequence: 90,
  },
  {
    id: 'user_menu',
    name: 'Users',
    sequence: 10,
    parentId: 'settings_root',
    action: 'res.users.tree',
  },
  {
    id: 'group_menu',
    name: 'Groups',
    sequence: 20,
    parentId: 'settings_root',
    action: 'res.groups.tree',
  },
];
