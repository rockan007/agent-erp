import { envWithContext } from '@erp/domain';

export class PartnerController {
  static routes = [
    { path: '/api/partners', method: 'GET' as const, handler: 'list' },
    { path: '/api/partners/:id', method: 'GET' as const, handler: 'detail' },
    { path: '/api/partners', method: 'POST' as const, handler: 'create' },
    { path: '/api/partners/:id', method: 'PUT' as const, handler: 'update' },
    { path: '/api/partners/:id', method: 'DELETE' as const, handler: 'delete' },
  ];

  async list(ctx: { uid: number }) {
    return envWithContext('res.partner', { uid: ctx.uid }).search([]);
  }

  async detail(ctx: { uid: number; params: { id: string } }) {
    const records = await envWithContext('res.partner', { uid: ctx.uid })
      .browse([parseInt(ctx.params.id, 10)]);
    return records[0] ?? null;
  }

  async create(ctx: { uid: number; body: Record<string, unknown> }) {
    return envWithContext('res.partner', { uid: ctx.uid }).create(ctx.body);
  }

  async update(ctx: { uid: number; params: { id: string }; body: Record<string, unknown> }) {
    return envWithContext('res.partner', { uid: ctx.uid })
      .write([parseInt(ctx.params.id, 10)], ctx.body);
  }

  async delete(ctx: { uid: number; params: { id: string } }) {
    return envWithContext('res.partner', { uid: ctx.uid })
      .unlink([parseInt(ctx.params.id, 10)]);
  }
}
