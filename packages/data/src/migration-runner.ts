import { Knex } from 'knex';
import { getKnex } from './connection';

export interface Migration {
  name: string;
  up: (knex: Knex) => Promise<void>;
  down: (knex: Knex) => Promise<void>;
}

export async function runMigrations(migrations: Migration[]): Promise<void> {
  const knex = getKnex();

  const hasTable = await knex.schema.hasTable('erp_migrations');
  if (!hasTable) {
    await knex.schema.createTable('erp_migrations', (table) => {
      table.string('name').primary();
      table.timestamp('run_at').defaultTo(knex.fn.now());
    });
  }

  const completed = await knex('erp_migrations').select('name');
  const completedNames = new Set(completed.map((r: { name: string }) => r.name));

  for (const migration of migrations) {
    if (!completedNames.has(migration.name)) {
      await migration.up(knex);
      await knex('erp_migrations').insert({ name: migration.name });
    }
  }
}

export async function rollbackMigrations(migrations: Migration[]): Promise<void> {
  const knex = getKnex();
  const completed = await knex('erp_migrations').select('name');
  const completedNames = new Set(completed.map((r: { name: string }) => r.name));

  for (const migration of [...migrations].reverse()) {
    if (completedNames.has(migration.name)) {
      await migration.down(knex);
      await knex('erp_migrations').where('name', migration.name).del();
    }
  }
}
