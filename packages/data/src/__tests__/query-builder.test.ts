import { describe, it, expect, afterEach } from 'vitest';
import { buildWhereClause, buildQuery } from '../query-builder';
import { initConnection, closeConnection, getKnex } from '../connection';

describe('buildWhereClause', () => {
  afterEach(async () => {
    await closeConnection();
  });

  it('should build where clause for equals operator', () => {
    initConnection({
      host: 'localhost', port: 5432, database: 'test', user: 'test', password: 'test',
    });
    const knex = getKnex();
    let query = knex('test_table');
    query = buildWhereClause(query, [['name', '=', 'test']]);
    const sql = query.toString();
    expect(sql).toContain('"name"');
  });

  it('should build where clause for multiple domain tuples', () => {
    initConnection({
      host: 'localhost', port: 5432, database: 'test', user: 'test', password: 'test',
    });
    const knex = getKnex();
    let query = knex('test_table');
    query = buildWhereClause(query, [
      ['name', '=', 'test'],
      ['age', '>', 18],
    ]);
    const sql = query.toString();
    expect(sql).toContain('"name"');
    expect(sql).toContain('"age"');
  });

  it('should handle "in" operator', () => {
    initConnection({
      host: 'localhost', port: 5432, database: 'test', user: 'test', password: 'test',
    });
    const knex = getKnex();
    let query = knex('test_table');
    query = buildWhereClause(query, [['id', 'in', [1, 2, 3]]]);
    const sql = query.toString();
    expect(sql).toContain('"id"');
    expect(sql).toContain('in');
  });
});

describe('buildQuery', () => {
  afterEach(async () => {
    await closeConnection();
  });

  it('should build a basic select query', () => {
    initConnection({
      host: 'localhost', port: 5432, database: 'test', user: 'test', password: 'test',
    });
    const query = buildQuery('test_table', { columns: ['id', 'name'] });
    const sql = query.toString();
    expect(sql).toContain('select');
    expect(sql).toContain('"id"');
    expect(sql).toContain('"name"');
  });

  it('should apply limit and offset', () => {
    initConnection({
      host: 'localhost', port: 5432, database: 'test', user: 'test', password: 'test',
    });
    const query = buildQuery('test_table', { limit: 10, offset: 5 });
    const sql = query.toString();
    expect(sql).toContain('limit');
  });

  it('should apply orderBy', () => {
    initConnection({
      host: 'localhost', port: 5432, database: 'test', user: 'test', password: 'test',
    });
    const query = buildQuery('test_table', { orderBy: 'created_at', orderDir: 'desc' });
    const sql = query.toString();
    expect(sql).toContain('order by');
  });

  it('should handle empty options', () => {
    initConnection({
      host: 'localhost', port: 5432, database: 'test', user: 'test', password: 'test',
    });
    const query = buildQuery('test_table');
    expect(query).toBeDefined();
  });
});
