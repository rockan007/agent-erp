import type { Knex } from 'knex';
import { describe, it, expect, vi } from 'vitest';
import { generateCode, storeCode, verifyCode, cleanupExpiredCodes } from '../auth/verification';

// Mock knex — Knex is callable as db('table_name'), so the mock must be a function
function mockKnex(): Knex {
  const rows: Record<string, unknown>[] = [];

  const chain: Record<string, unknown> = {
    where: vi.fn().mockReturnThis(),
    whereRaw: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([]),
    }),
    delete: vi.fn().mockResolvedValue(1),
    andWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
  };

  chain.insert = vi.fn().mockImplementation((data) => {
    const row = { ...data, id: rows.length + 1, created_at: new Date() };
    rows.push(row);
    return { ...chain, returning: vi.fn().mockResolvedValue([row]) };
  });

  // db('erp_verification_codes') returns the chain
  const db = vi.fn().mockReturnValue(chain);

  // Transaction: runs the callback with a trx that is also callable like db
  const trx = vi.fn().mockReturnValue(chain);
  Object.assign(trx, chain, { commit: vi.fn(), rollback: vi.fn() });
  chain.transaction = vi.fn().mockImplementation(
    (cb: (trx: unknown) => Promise<void>) => cb(trx),
  );

  // Attach chain methods directly to db so mock assertions work on db directly
  Object.assign(db, chain);
  (db as Record<string, unknown>)._rows = rows;
  (db as Record<string, unknown>)._chain = chain;

  return db as unknown as Knex;
}

describe('generateCode', () => {
  it('returns a 6-digit string', () => {
    const code = generateCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('produces values in range 100000-999999', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateCode();
      const num = parseInt(code, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });
});

describe('storeCode', () => {
  it('inserts a code and returns it', async () => {
    const db = mockKnex();
    const code = await storeCode(db, 1, 'register');
    expect(code).toMatch(/^\d{6}$/);
    expect(db.insert).toHaveBeenCalled();
  });
});

describe('verifyCode', () => {
  it('returns true for valid code', async () => {
    const db = mockKnex();
    const code = '123456';

    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: 1 }]),
    });

    const result = await verifyCode(db, 1, code, 'register');
    expect(result).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });

  it('returns false for expired code', async () => {
    const db = mockKnex();
    // Record exists in DB but expires_at is in the past,
    // so the SQL whereRaw("expires_at > NOW()") filters it out.
    // The atomic UPDATE affects 0 rows, so returning('id') yields [].

    const result = await verifyCode(db, 1, '123456', 'register');
    expect(result).toBe(false);
  });

  it('returns false for already-used code', async () => {
    const db = mockKnex();
    // Record exists in DB but used=true, so the SQL
    // where({ used: false }) filters it out.
    // The atomic UPDATE affects 0 rows, so returning('id') yields [].

    const result = await verifyCode(db, 1, '123456', 'register');
    expect(result).toBe(false);
  });

  it('returns false for wrong code', async () => {
    const db = mockKnex();
    // The atomic UPDATE affects 0 rows because no matching code,
    // so returning('id') yields [].

    const result = await verifyCode(db, 1, '000000', 'register');
    expect(result).toBe(false);
  });
});

describe('cleanupExpiredCodes', () => {
  it('deletes expired codes', async () => {
    const db = mockKnex();
    await cleanupExpiredCodes(db);
    expect(db.whereRaw).toHaveBeenCalled();
    expect(db.delete).toHaveBeenCalled();
  });
});
