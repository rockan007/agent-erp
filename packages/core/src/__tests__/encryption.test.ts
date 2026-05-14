import { describe, it, expect } from 'vitest';
import {
  encryptField,
  decryptField,
  encryptRecord,
  decryptRecord,
} from '../security/encryption';

describe('encryption', () => {
  it('should encrypt and decrypt a value', () => {
    const original = 'secret-data-123';
    const encrypted = encryptField(original);
    expect(encrypted).not.toBe(original);
    expect(decryptField(encrypted!)).toBe(original);
  });

  it('should handle null/undefined', () => {
    expect(encryptField(null)).toBeNull();
    expect(decryptField(null)).toBeNull();
  });

  it('should encrypt specific fields in a record', () => {
    const record = {
      name: 'John',
      ssn: '123-45-6789',
      phone: '555-0100',
    };
    const encrypted = encryptRecord(record, ['ssn']);
    expect(encrypted.name).toBe('John');
    expect(encrypted.ssn).not.toBe('123-45-6789');
    expect(encrypted.phone).toBe('555-0100');
  });

  it('should decrypt and restore original record', () => {
    const original = { name: 'John', ssn: '123-45-6789' };
    const encrypted = encryptRecord(original, ['ssn']);
    const decrypted = decryptRecord(encrypted, ['ssn']);
    expect(decrypted).toEqual(original);
  });
});
