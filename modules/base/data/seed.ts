import type { Knex } from 'knex';
import { hashPassword } from '@erp/core/auth';

export default async function seed(knex: Knex): Promise<void> {
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
