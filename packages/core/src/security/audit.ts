import { getKnex } from '@erp/data';

export interface AuditEntry {
  user_id: number;
  model: string;
  record_id: number;
  operation: 'create' | 'write' | 'unlink';
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  timestamp?: Date;
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  const knex = getKnex();
  const hasTable = await knex.schema.hasTable('audit_log');

  if (!hasTable) {
    await knex.schema.createTable('audit_log', (table) => {
      table.bigIncrements('id');
      table.integer('user_id').notNullable();
      table.string('model').notNullable();
      table.integer('record_id').notNullable();
      table.string('operation').notNullable();
      table.jsonb('old_values');
      table.jsonb('new_values');
      table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
  }

  await knex('audit_log').insert({
    user_id: entry.user_id,
    model: entry.model,
    record_id: entry.record_id,
    operation: entry.operation,
    old_values: entry.old_values ? JSON.stringify(entry.old_values) : null,
    new_values: entry.new_values ? JSON.stringify(entry.new_values) : null,
    timestamp: entry.timestamp ?? knex.fn.now(),
  });
}

export async function getAuditLog(
  model: string,
  recordId: number,
): Promise<AuditEntry[]> {
  const knex = getKnex();
  const rows = await knex('audit_log')
    .where({ model, record_id: recordId })
    .orderBy('timestamp', 'desc');

  return rows.map((r: Record<string, unknown>) => ({
    user_id: r.user_id as number,
    model: r.model as string,
    record_id: r.record_id as number,
    operation: r.operation as AuditEntry['operation'],
    old_values: typeof r.old_values === 'string'
      ? JSON.parse(r.old_values as string)
      : r.old_values,
    new_values: typeof r.new_values === 'string'
      ? JSON.parse(r.new_values as string)
      : r.new_values,
    timestamp: r.timestamp as Date,
  }));
}
