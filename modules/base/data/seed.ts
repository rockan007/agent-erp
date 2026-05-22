import type { Knex } from 'knex';
import { hashPassword } from '@erp/core';

export default async function seed(knex: Knex): Promise<void> {
  // Create verification codes table if not exists
  const hasVerificationCodesTable = await knex.schema.hasTable('erp_verification_codes');
  if (!hasVerificationCodesTable) {
    await knex.schema.createTable('erp_verification_codes', (t) => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('res_users').onDelete('CASCADE');
      t.string('code', 6).notNullable();
      t.string('type', 20).notNullable();
      t.timestamp('expires_at', { useTz: true }).notNullable();
      t.boolean('used').defaultTo(false);
      t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    });
  }

  // Create translations table if not exists (reserved for future business module translations)
  const hasTranslationsTable = await knex.schema.hasTable('erp_translations');
  if (!hasTranslationsTable) {
    await knex.schema.createTable('erp_translations', (t) => {
      t.increments('id').primary();
      t.string('module', 64);
      t.string('resource_type', 32);
      t.string('resource_id', 128);
      t.string('lang', 10);
      t.text('value').notNullable();
      t.unique(['module', 'resource_type', 'resource_id', 'lang']);
    });
  }

  // Insert groups (idempotent)
  const existingAdmin = await knex('res_groups').where({ name: 'admin' }).first();
  if (!existingAdmin) {
    await knex('res_groups').insert({ name: 'admin', description: 'System Administrator' });
  }

  const existingBaseUser = await knex('res_groups').where({ name: 'base_user' }).first();
  if (!existingBaseUser) {
    await knex('res_groups').insert({ name: 'base_user', description: 'Base User' });
  }

  // Get admin group ID
  const adminGroup = await knex('res_groups').where({ name: 'admin' }).first();

  // Insert admin user (idempotent)
  const existingAdminUser = await knex('res_users').where({ login: 'admin' }).first();
  let adminUserId: number;
  if (!existingAdminUser) {
    const hashed = await hashPassword('admin');
    const [inserted] = await knex('res_users').insert({
      name: 'Administrator',
      login: 'admin',
      password: hashed,
      email: 'admin@example.com',
      active: true,
    }).returning('id');
    adminUserId = inserted.id;
  } else {
    adminUserId = existingAdminUser.id;
  }

  // Assign admin user to admin group (idempotent)
  if (adminGroup) {
    const existingRel = await knex('res_users_groups_rel')
      .where({ user_id: adminUserId, group_id: adminGroup.id })
      .first();
    if (!existingRel) {
      await knex('res_users_groups_rel').insert({
        user_id: adminUserId,
        group_id: adminGroup.id,
      });
    }
  }
}
