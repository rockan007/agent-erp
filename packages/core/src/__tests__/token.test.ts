import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from '../auth/token';

describe('signToken', () => {
  it('returns a string token', () => {
    const token = signToken({ userId: 1, groups: ['admin'] });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });
});

describe('verifyToken', () => {
  it('returns payload for a valid token', () => {
    const payload = { userId: 1, groups: ['admin'] };
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(1);
    expect(decoded.groups).toEqual(['admin']);
  });

  it('throws for invalid token', () => {
    expect(() => verifyToken('bad.token.here')).toThrow();
  });
});
