import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runMigrations, Migration } from '../migration-runner';

// Build a fake knex instance that the migration runner can use
function createMockKnex() {
  const tables: Record<string, unknown[]> = {};
  let migrationsTableExists = false;

  function createQueryBuilder(tableName: string) {
    const chain: Record<string, unknown> = { _table: tableName };
    let whereField: string | null = null;
    let whereValue: unknown = null;

    const builder: Record<string, unknown> = {
      select: vi.fn((_columns: string | string[]) => {
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
            (r: unknown) => (r as Record<string, unknown>).name !== whereValue,
          );
        }
      }),
      insert: vi.fn(async (row: unknown) => {
        if (!tables[chain._table]) {
          tables[chain._table] = [];
        }
        tables[chain._table].push(row);
        // Knex insert returns an array of inserted IDs
        return [tables[chain._table].length];
      }),
      then: vi.fn((resolve: (value: unknown) => void) => {
        // When `.select('name')` is awaited, return the stored rows
        if (chain._op === 'select') {
          resolve(tables[chain._table] || []);
        }
        return Promise.resolve();
      }),
      // Make the builder thenable so it can be awaited like knex('table').select('name')
      [Symbol.for('thenable')]: undefined,
    };

    // Make the builder itself thenable for when select() is awaited directly
    const proxy = new Proxy(builder, {
      get(target, prop, receiver) {
        if (prop === 'then') {
          return (resolve: (value: unknown) => void, reject?: (e: Error) => void) => {
            try {
              if (chain._op === 'select') {
                resolve(tables[chain._table] || []);
              } else if (chain._op === 'where') {
                resolve(undefined);
              } else if (chain._op === 'insert') {
                resolve([(tables[chain._table] || []).length]);
              } else {
                resolve(undefined);
              }
            } catch (e) {
              reject?.(e as Error);
            }
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    });

    return proxy;
  }

  const knexFn = ((tableName: string) => {
    return createQueryBuilder(tableName);
  }) as unknown as Record<string, unknown>;

  knexFn.schema = {
    hasTable: vi.fn(async (_name: string) => {
      return migrationsTableExists;
    }),
    createTable: vi.fn(async (_name: string, callback: (table: Record<string, unknown>) => void) => {
      const mockTable = {
        string: vi.fn(() => mockTable),
        primary: vi.fn(() => mockTable),
        timestamp: vi.fn(() => mockTable),
        defaultTo: vi.fn(() => mockTable),
      };
      callback(mockTable);
      tables['erp_migrations'] = [];
      migrationsTableExists = true;
    }),
  };

  knexFn.fn = {
    now: vi.fn(() => new Date()),
  };

  return knexFn;
}

// Mock the connection module
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

import { initConnection, closeConnection } from '../connection';

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
        down: async () => { executed = executed.filter(x => x !== '001'); },
      },
      {
        name: '002_test',
        up: async () => { executed.push('002'); },
        down: async () => { executed = executed.filter(x => x !== '002'); },
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
});
