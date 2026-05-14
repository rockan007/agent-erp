import { describe, it, expect, beforeEach } from 'vitest';
import { AclRegistry } from '../security/acl';

describe('AclRegistry', () => {
  let acl: AclRegistry;

  beforeEach(() => {
    acl = new AclRegistry();
    acl.register([
      {
        model: 'res.partner',
        group: 'base_user',
        permissions: {
          read: true,
          write: true,
          create: true,
          unlink: false,
        },
      },
      {
        model: 'res.partner',
        group: 'admin',
        permissions: {
          read: true,
          write: true,
          create: true,
          unlink: true,
        },
      },
    ]);
  });

  it('should allow read for base_user', () => {
    expect(acl.check('res.partner', 'read', ['base_user'])).toBe(true);
  });

  it('should deny unlink for base_user', () => {
    expect(acl.check('res.partner', 'unlink', ['base_user'])).toBe(false);
  });

  it('should allow unlink for admin', () => {
    expect(acl.check('res.partner', 'unlink', ['admin'])).toBe(true);
  });

  it('should deny all for unregistered group', () => {
    expect(acl.check('res.partner', 'read', ['nobody'])).toBe(false);
  });

  it('getRules should return matching rules', () => {
    expect(acl.getRules('res.partner')).toHaveLength(2);
  });
});
