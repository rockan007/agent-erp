import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY =
  process.env.ERP_ENCRYPTION_KEY ?? 'change-me-in-production-32chars!!';

export function encrypt(value: string): string {
  return CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
}

export function decrypt(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function encryptField(value: string | null | undefined): string | null {
  if (value == null) return null;
  return encrypt(value);
}

export function decryptField(
  encrypted: string | null | undefined,
): string | null {
  if (encrypted == null) return null;
  return decrypt(encrypted);
}

export function encryptRecord(
  record: Record<string, unknown>,
  encryptedFields: string[],
): Record<string, unknown> {
  const result = { ...record };
  for (const field of encryptedFields) {
    if (typeof result[field] === 'string') {
      result[field] = encryptField(result[field] as string);
    }
  }
  return result;
}

export function decryptRecord(
  record: Record<string, unknown>,
  encryptedFields: string[],
): Record<string, unknown> {
  const result = { ...record };
  for (const field of encryptedFields) {
    if (typeof result[field] === 'string') {
      result[field] = decryptField(result[field] as string);
    }
  }
  return result;
}
