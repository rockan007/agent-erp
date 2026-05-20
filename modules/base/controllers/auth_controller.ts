import { env } from '@erp/domain';
import { hashPassword, verifyPassword, signToken, storeCode, verifyCode } from '@erp/core';
import { getKnex } from '@erp/data';

export class AuthController {
  static routes = [
    { path: '/api/auth/login', method: 'POST' as const, handler: 'login', auth: false },
    { path: '/api/auth/register', method: 'POST' as const, handler: 'register', auth: false },
    { path: '/api/auth/verify-registration', method: 'POST' as const, handler: 'verifyRegistration', auth: false },
    { path: '/api/auth/forgot-password', method: 'POST' as const, handler: 'forgotPassword', auth: false },
    { path: '/api/auth/reset-password', method: 'POST' as const, handler: 'resetPassword', auth: false },
  ];

  async login(ctx: { body: Record<string, unknown> }) {
    const { login, password } = ctx.body;

    if (!login || !password) {
      throw new Error('Login and password are required');
    }

    const knex = getKnex();
    const user = await knex('res_users')
      .where({ login: login as string, active: true })
      .first();

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const valid = await verifyPassword(password as string, user.password);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const groupRows = await knex('res_users_groups_rel')
      .where({ user_id: user.id })
      .select('group_id');

    const groups = groupRows.map((r: { group_id: unknown }) => String(r.group_id));
    const token = signToken({ userId: user.id, groups });

    return {
      token,
      user: { id: user.id, name: user.name, groups },
    };
  }

  async register(ctx: { body: Record<string, unknown> }) {
    const { name, login, password, email } = ctx.body;

    if (!name || !login || !password || !email) {
      throw new Error('Name, login, password, and email are required');
    }

    if (typeof password === 'string' && password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const knex = getKnex();

    const existingLogin = await knex('res_users')
      .where({ login: login as string })
      .first();
    if (existingLogin) {
      throw new Error('A user with this login already exists');
    }

    const existingEmail = await knex('res_users')
      .where({ email: email as string })
      .first();
    if (existingEmail) {
      throw new Error('A user with this email already exists');
    }

    const hashed = await hashPassword(password as string);
    const created = await env('res.users').create({
      name: name as string,
      login: login as string,
      password: hashed,
      email: email as string,
      active: false,
    });

    const code = await storeCode(knex, (created as Record<string, unknown>).id as number, 'register');

    console.log(`[DEV] Verification code for ${login}: ${code}`);

    return {
      userId: (created as Record<string, unknown>).id,
      message: 'Registration successful. Please verify your email.',
    };
  }

  async verifyRegistration(ctx: { body: Record<string, unknown> }) {
    const { userId, code } = ctx.body;

    if (!userId || !code) {
      throw new Error('User ID and code are required');
    }

    const knex = getKnex();
    const valid = await verifyCode(knex, userId as number, code as string, 'register');

    if (!valid) {
      throw new Error('Invalid or expired verification code');
    }

    await env('res.users').write([userId as number], { active: true });

    return { message: 'Account activated. You can now log in.' };
  }

  async forgotPassword(ctx: { body: Record<string, unknown> }) {
    const { email } = ctx.body;

    if (!email) {
      throw new Error('Email is required');
    }

    const knex = getKnex();
    const user = await knex('res_users')
      .where({ email: email as string })
      .first();

    if (!user) {
      return { message: 'If the email exists, a reset code has been sent.' };
    }

    const code = await storeCode(knex, user.id, 'reset');

    console.log(`[DEV] Password reset for user ID ${user.id} (${user.login}): code ${code}`);

    return { message: 'If the email exists, a reset code has been sent.' };
  }

  async resetPassword(ctx: { body: Record<string, unknown> }) {
    const { userId, code, password } = ctx.body;

    if (!userId || !code || !password) {
      throw new Error('User ID, code, and new password are required');
    }

    if (typeof password === 'string' && password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const knex = getKnex();
    const valid = await verifyCode(knex, userId as number, code as string, 'reset');

    if (!valid) {
      throw new Error('Invalid or expired reset code');
    }

    const hashed = await hashPassword(password as string);
    await env('res.users').write([userId as number], { password: hashed });

    return { message: 'Password has been reset. You can now log in.' };
  }
}
