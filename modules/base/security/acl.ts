export const baseAcl = [
  {
    model: 'res.partner',
    group: 'base_user',
    permissions: { read: true, write: true, create: true, unlink: false },
  },
  {
    model: 'res.partner',
    group: 'admin',
    permissions: { read: true, write: true, create: true, unlink: true },
  },
  {
    model: 'res.users',
    group: 'admin',
    permissions: { read: true, write: true, create: true, unlink: true },
  },
  {
    model: 'res.groups',
    group: 'admin',
    permissions: { read: true, write: true, create: true, unlink: true },
  },
  {
    model: 'res.groups',
    group: 'base_user',
    permissions: { read: true, write: false, create: false, unlink: false },
  },
];
