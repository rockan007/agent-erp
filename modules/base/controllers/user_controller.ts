import { envWithContext } from '@erp/domain';
import { hashPassword } from '@erp/core';

export class UserController {
  static routes = [
    { path: '/api/users', method: 'GET' as const, handler: 'list' },
    { path: '/api/users/:id', method: 'GET' as const, handler: 'detail' },
    { path: '/api/users', method: 'POST' as const, handler: 'create' },
    { path: '/api/users/:id', method: 'PUT' as const, handler: 'update' },
    { path: '/api/users/:id', method: 'DELETE' as const, handler: 'delete' },
  ];

  async list(ctx: { uid: number }) {
    const records = await envWithContext('res.users', { uid: ctx.uid }).search([]);
    return records.map((r: Record<string, unknown>) => {
      const { password: _password, ...safe } = r;
      return safe;
    });
  }

  async detail(ctx: { uid: number; params: { id: string } }) {
    const records = await envWithContext('res.users', { uid: ctx.uid })
      .browse([parseInt(ctx.params.id, 10)]);
    const record = records[0] ?? null;
    if (record) {
      const { password: _password, ...safe } = record as Record<string, unknown>;
      return safe;
    }
    return null;
  }

  async create(ctx: { uid: number; body: Record<string, unknown> }) {
    const { password, ...rest } = ctx.body;
    if (password && typeof password === 'string' && password.length > 0) {
      (rest as Record<string, unknown>).password = await hashPassword(password);
    }
    const created = await envWithContext('res.users', { uid: ctx.uid }).create(rest);
    const { password: _password, ...safe } = created as Record<string, unknown>;
    return safe;
  }

  async update(ctx: { uid: number; params: { id: string }; body: Record<string, unknown> }) {
    const { password, ...rest } = ctx.body;
    if (password && typeof password === 'string' && password.length > 0) {
      (rest as Record<string, unknown>).password = await hashPassword(password);
    }
    const result = await envWithContext('res.users', { uid: ctx.uid })
      .write([parseInt(ctx.params.id, 10)], rest);
    if (result) {
      const { password: _password, ...safe } = result as Record<string, unknown>;
      return safe;
    }
    return result;
  }

  async delete(ctx: { uid: number; params: { id: string } }) {
    return envWithContext('res.users', { uid: ctx.uid })
      .unlink([parseInt(ctx.params.id, 10)]);
  }
}
