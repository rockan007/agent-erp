import { env } from '@erp/domain';
import { hashPassword, verifyPassword, signToken, storeCode, verifyCode, tError } from '@erp/core';
import { getKnex } from '@erp/data';

export class AuthController {
  static routes = [
    { path: '/api/auth/login', method: 'POST' as const, handler: 'login', auth: false },
    { path: '/api/auth/register', method: 'POST' as const, handler: 'register', auth: false },
    { path: '/api/auth/verify-registration', method: 'POST' as const, handler: 'verifyRegistration', auth: false },
    { path: '/api/auth/forgot-password', method: 'POST' as const, handler: 'forgotPassword', auth: false },
    { path: '/api/auth/reset-password', method: 'POST' as const, handler: 'resetPassword', auth: false },
  ];

  async login(ctx: { body: Record<string, unknown>; locale?: string }) {
    const { login, password } = ctx.body;
    const lang = ctx.locale ?? 'en_US';

    if (!login || !password) {
      throw new Error(tError(lang, 'errors:auth.login_password_required'));
    }

    const knex = getKnex();
    const user = await knex('res_users')
      .where({ login: login as string, active: true })
      .first();

    if (!user) {
      throw new Error(tError(lang, 'errors:auth.invalid_credentials'));
    }

    const valid = await verifyPassword(password as string, user.password);
    if (!valid) {
      throw new Error(tError(lang, 'errors:auth.invalid_credentials'));
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

  async register(ctx: { body: Record<string, unknown>; locale?: string }) {
    const { name, login, password, email } = ctx.body;
    const lang = ctx.locale ?? 'en_US';

    if (!name || !login || !password || !email) {
      throw new Error(tError(lang, 'errors:auth.name_login_password_email_required'));
    }

    if (typeof password === 'string' && password.length < 6) {
      throw new Error(tError(lang, 'errors:auth.password_too_short'));
    }

    const knex = getKnex();

    const existingLogin = await knex('res_users')
      .where({ login: login as string })
      .first();
    if (existingLogin) {
      throw new Error(tError(lang, 'errors:auth.user_exists'));
    }

    const existingEmail = await knex('res_users')
      .where({ email: email as string })
      .first();
    if (existingEmail) {
      throw new Error(tError(lang, 'errors:auth.email_exists'));
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

  async verifyRegistration(ctx: { body: Record<string, unknown>; locale?: string }) {
    const { userId, code } = ctx.body;
    const lang = ctx.locale ?? 'en_US';

    if (!userId || !code) {
      throw new Error(tError(lang, 'errors:auth.user_id_code_required'));
    }

    const knex = getKnex();
    const valid = await verifyCode(knex, userId as number, code as string, 'register');

    if (!valid) {
      throw new Error(tError(lang, 'errors:auth.invalid_code'));
    }

    await env('res.users').write([userId as number], { active: true });

    return { message: 'Account activated. You can now log in.' };
  }

  async forgotPassword(ctx: { body: Record<string, unknown>; locale?: string }) {
    const { email } = ctx.body;
    const lang = ctx.locale ?? 'en_US';

    if (!email) {
      throw new Error(tError(lang, 'errors:auth.email_required'));
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

  async resetPassword(ctx: { body: Record<string, unknown>; locale?: string }) {
    const { userId, code, password } = ctx.body;
    const lang = ctx.locale ?? 'en_US';

    if (!userId || !code || !password) {
      throw new Error(tError(lang, 'errors:auth.user_id_code_password_required'));
    }

    if (typeof password === 'string' && password.length < 6) {
      throw new Error(tError(lang, 'errors:auth.password_too_short'));
    }

    const knex = getKnex();
    const valid = await verifyCode(knex, userId as number, code as string, 'reset');

    if (!valid) {
      throw new Error(tError(lang, 'errors:auth.invalid_reset_code'));
    }

    const hashed = await hashPassword(password as string);
    await env('res.users').write([userId as number], { password: hashed });

    return { message: 'Password has been reset. You can now log in.' };
  }
}
