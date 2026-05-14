import { describe, it, expect, afterEach } from 'vitest';
import { initConnection, getConnection, closeConnection, getKnex } from '../connection';

describe('connection', () => {
  afterEach(async () => {
    await closeConnection();
  });

  it('should throw if not initialized', () => {
    expect(() => getConnection()).toThrow('Database not initialized');
  });

  it('should init and return connection', () => {
    const conn = initConnection({
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      user: 'test',
      password: 'test',
    });
    expect(conn).toBeDefined();
    expect(getConnection()).toBe(conn);
  });

  it('getKnex should return same connection', () => {
    initConnection({
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      user: 'test',
      password: 'test',
    });
    expect(getKnex()).toBe(getConnection());
  });
});
