import { envWithContext } from '@erp/domain';
import { hashPassword } from '@erp/core/auth';

export class UserController {
  static routes = [
    { path: '/api/users', method: 'GET' as const, handler: 'list' },
    { path: '/api/users/:id', method: 'GET' as const, handler: 'detail' },
    { path: '/api/users', method: 'POST' as const, handler: 'create' },
    { path: '/api/users/:id', method: 'PUT' as const, handler: 'update' },
    { path: '/api/users/:id', method: 'DELETE' as const, handler: 'delete' },
  ];

  async list(ctx: { uid: number }) {
    return envWithContext('res.users', { uid: ctx.uid }).search([]);
  }

  async detail(ctx: { uid: number; params: { id: string } }) {
    const records = await envWithContext('res.users', { uid: ctx.uid })
      .browse([parseInt(ctx.params.id)]);
    return records[0] ?? null;
  }

  async create(ctx: { uid: number; body: Record<string, unknown> }) {
    const { password, ...rest } = ctx.body;
    if (password && typeof password === 'string' && password.length > 0) {
      (rest as any).password = await hashPassword(password);
    }
    return envWithContext('res.users', { uid: ctx.uid }).create(rest);
  }

  async update(ctx: { uid: number; params: { id: string }; body: Record<string, unknown> }) {
    const { password, ...rest } = ctx.body;
    if (password && typeof password === 'string' && password.length > 0) {
      (rest as any).password = await hashPassword(password);
    }
    return envWithContext('res.users', { uid: ctx.uid })
      .write([parseInt(ctx.params.id)], rest);
  }

  async delete(ctx: { uid: number; params: { id: string } }) {
    return envWithContext('res.users', { uid: ctx.uid })
      .unlink([parseInt(ctx.params.id)]);
  }
}
