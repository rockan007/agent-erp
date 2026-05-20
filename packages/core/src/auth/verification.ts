import crypto from 'node:crypto';
import type { Knex } from 'knex';

const CODE_EXPIRY_MINUTES = 10;

export function generateCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function storeCode(
  db: Knex,
  userId: number,
  type: 'register' | 'reset',
): Promise<string> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  await db('erp_verification_codes').insert({
    user_id: userId,
    code,
    type,
    expires_at: expiresAt,
  });

  return code;
}

export async function cleanupExpiredCodes(db: Knex): Promise<void> {
  await db('erp_verification_codes')
    .whereRaw("expires_at <= NOW()")
    .delete();
}

export async function verifyCode(
  db: Knex,
  userId: number,
  code: string,
  type: 'register' | 'reset',
): Promise<boolean> {
  await cleanupExpiredCodes(db);

  const [result] = await db('erp_verification_codes')
    .where({ user_id: userId, code, type, used: false })
    .whereRaw('expires_at > NOW()')
    .orderBy('id', 'desc')
    .limit(1)
    .update({ used: true })
    .returning('id');

  return result !== undefined;
}
