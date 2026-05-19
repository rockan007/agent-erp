import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runMigrations, Migration } from '../migration-runner';

import { initConnection, closeConnection } from '../connection';

function createMockKnex() {
  const tables: Record<string, Record<string, unknown>[]> = {};
  let migrationsTableExists = false;

  function createQueryBuilder(tableName: string) {
    const chain: { _table: string; _op?: string } = { _table: tableName };
    let whereField: string | null = null;
    let whereValue: unknown = null;

    const execute = (): unknown => {
      if (chain._op === 'select') {
        return tables[chain._table] || [];
      }
      if (chain._op === 'insert') {
        return [(tables[chain._table] || []).length];
      }
      return undefined;
    };

    const builder: Record<string, unknown> = {
      select: vi.fn(() => {
        chain._op = 'select';
        return builder;
      }),
      where: vi.fn((field: string, value: unknown) => {
        whereField = field;
        whereValue = value;
        chain._op = 'where';
        return builder;
      }),
      del: vi.fn(async () => {
        if (whereField === 'name' && chain._table === 'erp_migrations') {
          const rows = tables[chain._table] || [];
          tables[chain._table] = rows.filter(
            (r) => r.name !== whereValue,
          );
        }
        return undefined;
      }),
      insert: vi.fn(async (row: Record<string, unknown>) => {
        if (!tables[chain._table]) {
          tables[chain._table] = [];
        }
        tables[chain._table]!.push(row);
        return [tables[chain._table]!.length];
      }),
      then: (resolve: (value: unknown) => void) => {
        resolve(execute());
      },
    };

    return builder;
  }

  interface ChainableMock {
    string: () => ChainableMock;
    primary: () => ChainableMock;
    timestamp: () => ChainableMock;
    defaultTo: () => ChainableMock;
  }

  const knexFn = ((tableName: string) => createQueryBuilder(tableName)) as unknown as Record<string, unknown> & ((tableName: string) => ReturnType<typeof createQueryBuilder>);

  knexFn.schema = {
    hasTable: vi.fn(async () => migrationsTableExists),
    createTable: vi.fn(async (_name: string, callback: (table: Record<string, unknown>) => void) => {
      const chainable: ChainableMock = {
        string: () => chainable,
        primary: () => chainable,
        timestamp: () => chainable,
        defaultTo: () => chainable,
      };
      callback(chainable as unknown as Record<string, unknown>);
      tables.erp_migrations = [];
      migrationsTableExists = true;
    }),
  };

  knexFn.fn = {
    now: vi.fn(() => new Date()),
  };

  return knexFn;
}

vi.mock('../connection', () => {
  let _knex: Record<string, unknown> | null = null;
  return {
    getKnex: () => {
      if (!_knex) throw new Error('Database not initialized');
      return _knex;
    },
    getConnection: () => {
      if (!_knex) throw new Error('Database not initialized');
      return _knex;
    },
    initConnection: () => {
      _knex = createMockKnex();
      return _knex;
    },
    closeConnection: async () => {
      _knex = null;
    },
  };
});

describe('migration-runner', () => {
  beforeEach(() => {
    initConnection({
      host: 'localhost', port: 5432, database: 'erp_test', user: 'test', password: 'test',
    });
  });

  afterEach(async () => {
    await closeConnection();
  });

  it('should run pending migrations in order', async () => {
    const executed: string[] = [];
    const migrations: Migration[] = [
      {
        name: '001_test',
        up: async () => { executed.push('001'); },
        down: async () => { /* noop */ },
      },
      {
        name: '002_test',
        up: async () => { executed.push('002'); },
        down: async () => { /* noop */ },
      },
    ];

    await runMigrations(migrations);
    expect(executed).toContain('001');
    expect(executed).toContain('002');
  });

  it('should run migrations in correct sequence', async () => {
    const executed: string[] = [];
    const migrations: Migration[] = [
      {
        name: '001_seq',
        up: async () => { executed.push('first'); },
        down: async () => {},
      },
      {
        name: '002_seq',
        up: async () => { executed.push('second'); },
        down: async () => {},
      },
    ];

    await runMigrations(migrations);
    expect(executed[0]).toBe('first');
    expect(executed[1]).toBe('second');
  });

  it('should skip already completed migrations', async () => {
    let callCount = 0;
    const migrations: Migration[] = [
      {
        name: '001_skip_test',
        up: async () => { callCount++; },
        down: async () => {},
      },
    ];

    // First run — should execute
    await runMigrations(migrations);
    expect(callCount).toBe(1);

    // Second run — should skip
    await runMigrations(migrations);
    expect(callCount).toBe(1);
  });
});
