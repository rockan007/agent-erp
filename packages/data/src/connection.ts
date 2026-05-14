import knex, { Knex } from 'knex';

export interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  pool?: { min: number; max: number };
}

let _knex: Knex | null = null;

export function getConnection(): Knex {
  if (!_knex) {
    throw new Error('Database not initialized. Call initConnection() first.');
  }
  return _knex;
}

export function initConnection(config: ConnectionConfig): Knex {
  if (_knex) {
    _knex.destroy();
    _knex = null;
  }
  _knex = knex({
    client: 'pg',
    connection: {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
    },
    pool: {
      min: config.pool?.min ?? 2,
      max: config.pool?.max ?? 10,
    },
    migrations: {
      tableName: 'erp_migrations',
    },
  });
  return _knex;
}

export async function closeConnection(): Promise<void> {
  if (_knex) {
    await _knex.destroy();
    _knex = null;
  }
}

export function getKnex(): Knex {
  return getConnection();
}
