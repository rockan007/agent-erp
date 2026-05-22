import { describe, it, expect } from 'vitest';
import { getRequestLocale, tError } from '../index';

describe('getRequestLocale', () => {
  it('returns en_US when header is undefined', () => {
    expect(getRequestLocale()).toBe('en_US');
  });

  it('returns en_US when header is empty', () => {
    expect(getRequestLocale('')).toBe('en_US');
  });

  it('parses zh-CN correctly', () => {
    expect(getRequestLocale('zh-CN')).toBe('zh_CN');
  });

  it('parses en-US correctly', () => {
    expect(getRequestLocale('en-US')).toBe('en_US');
  });

  it('parses simple "zh" tag', () => {
    expect(getRequestLocale('zh')).toBe('zh_CN');
  });

  it('parses simple "en" tag', () => {
    expect(getRequestLocale('en')).toBe('en_US');
  });

  it('respects quality values in Accept-Language', () => {
    const header = 'zh-CN,zh;q=0.9,en;q=0.8';
    expect(getRequestLocale(header)).toBe('zh_CN');
  });

  it('falls back to en_US for unknown languages', () => {
    expect(getRequestLocale('fr-FR')).toBe('en_US');
  });
});

describe('tError', () => {
  it('translates error message in zh_CN', () => {
    const result = tError('zh_CN', 'errors:auth.invalid_credentials');
    expect(result).toBe('用户名或密码错误');
  });

  it('translates error message in en_US', () => {
    const result = tError('en_US', 'errors:auth.invalid_credentials');
    expect(result).toBe('Invalid username or password');
  });

  it('falls back to en_US for unmapped language', () => {
    const result = tError('fr_FR', 'errors:auth.invalid_credentials');
    expect(result).toBe('Invalid username or password');
  });

  it('supports interpolation params', () => {
    const result = tError('zh_CN', 'errors:validation.required', { field: '邮箱' });
    expect(result).toBe('邮箱 为必填项');
  });
});
