import { describe, it, expect, beforeEach } from 'vitest';
import { FieldSecurityRegistry } from '../security/field-security';

describe('FieldSecurityRegistry', () => {
  let fs: FieldSecurityRegistry;

  beforeEach(() => {
    fs = new FieldSecurityRegistry();
    fs.register([
      {
        model: 'res.partner',
        group: 'base_user',
        fields: [
          { name: 'name', readable: true, writable: true },
          { name: 'phone', readable: true, writable: false },
          { name: 'internal_note', readable: false, writable: false },
        ],
      },
    ]);
  });

  it('should return readable fields for group', () => {
    const readable = fs.getReadableFields('res.partner', ['base_user']);
    expect(readable.has('name')).toBe(true);
    expect(readable.has('phone')).toBe(true);
    expect(readable.has('internal_note')).toBe(false);
  });

  it('should filter writable fields', () => {
    const writable = fs.getWritableFields('res.partner', ['base_user']);
    expect(writable.has('name')).toBe(true);
    expect(writable.has('phone')).toBe(false);
  });

  it('should filter data rows', () => {
    const data = [
      { id: 1, name: 'Test', phone: '123', internal_note: 'secret' },
    ];
    const filtered = fs.filterReadable('res.partner', data, ['base_user']);
    expect(filtered[0]).toHaveProperty('name');
    expect(filtered[0]).toHaveProperty('phone');
    expect(filtered[0]).not.toHaveProperty('internal_note');
  });
});
