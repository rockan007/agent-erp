import { describe, it, expect } from 'vitest';
import { maskValue, maskRecord } from '../security/masking';

describe('maskValue', () => {
  it('should mask phone number', () => {
    const result = maskValue('13812345678', 'phone');
    expect(result).toBe('138****5678');
  });

  it('should mask email', () => {
    const result = maskValue('johndoe@example.com', 'email');
    expect(result).toMatch(/j\*\*\*e@example\.com/);
  });

  it('should mask id_card', () => {
    const result = maskValue('310123199001011234', 'id_card');
    expect(result).toMatch(/^3101\*{10}1234$/);
  });

  it('should return original for short strings', () => {
    expect(maskValue('12', 'phone')).toBe('12');
  });
});

describe('maskRecord', () => {
  it('should mask specified fields', () => {
    const record = {
      name: 'John',
      phone: '13812345678',
      email: 'john@test.com',
    };
    const masked = maskRecord(record, {
      phone: 'phone',
      email: 'email',
    });
    expect(masked.name).toBe('John');
    expect(masked.phone).not.toBe('13812345678');
    expect(masked.email).not.toBe('john@test.com');
  });
});
