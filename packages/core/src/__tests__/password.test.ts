import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../auth/password';

describe('hashPassword', () => {
  it('returns a string different from the input', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).not.toBe('secret123');
    expect(hash.startsWith('$2b$')).toBe(true);
  });

  it('produces different hashes for same input', async () => {
    const h1 = await hashPassword('secret123');
    const h2 = await hashPassword('secret123');
    expect(h1).not.toBe(h2);
  });
});

describe('verifyPassword', () => {
  it('returns true for correct password', async () => {
    const hash = await hashPassword('secret123');
    expect(await verifyPassword('secret123', hash)).toBe(true);
  });

  it('returns false for wrong password', async () => {
    const hash = await hashPassword('secret123');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});
