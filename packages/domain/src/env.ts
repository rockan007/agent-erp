import { buildQuery, Domain } from '@erp/data';
import { ModelDefinition, RecordData } from './types';
import { getModelRegistry } from './registry';

export interface EnvContext {
  uid: number;
  lang?: string;
  tz?: string;
  [key: string]: unknown;
}

export class Env {
  private context: EnvContext;

  constructor(context: EnvContext) {
    this.context = { ...context };
  }

  withContext(extra: Record<string, unknown>): Env {
    return new Env({ ...this.context, ...extra });
  }

  getContext(): EnvContext {
    return { ...this.context };
  }

  get uid(): number {
    return this.context.uid;
  }
}

class ModelProxy {
  private modelName: string;
  private definition: ModelDefinition;
  private context: EnvContext;

  constructor(modelName: string, definition: ModelDefinition, context: EnvContext) {
    this.modelName = modelName;
    this.definition = definition;
    this.context = context;
  }

  private get tableName(): string {
    return this.definition._table ?? this.modelName.replace(/\./g, '_');
  }

  async search(domain: Domain = [], options: { limit?: number; offset?: number; orderBy?: string; orderDir?: 'asc' | 'desc' } = {}): Promise<RecordData[]> {
    const query = buildQuery(this.tableName, { domain, ...options });
    try {
      const rows = await query;
      return rows as RecordData[];
    } catch {
      return [];
    }
  }

  async browse(ids: number[]): Promise<RecordData[]> {
    return this.search([['id', 'in', ids]]);
  }

  async create(values: Record<string, unknown>): Promise<RecordData> {
    const query = buildQuery(this.tableName, {});
    const [result] = await query.insert(values).returning('*');
    return result as RecordData;
  }

  async write(ids: number[], values: Record<string, unknown>): Promise<number> {
    const query = buildQuery(this.tableName, {});
    return query.whereIn('id', ids).update(values);
  }

  async unlink(ids: number[]): Promise<number> {
    const query = buildQuery(this.tableName, {});
    return query.whereIn('id', ids).del();
  }

  async read(ids: number[], fields?: string[]): Promise<RecordData[]> {
    const query = buildQuery(this.tableName, {});
    if (fields) {
      query.select(fields);
    }
    const rows = await query.whereIn('id', ids);
    return rows as RecordData[];
  }

  withContext(extra: Record<string, unknown>): ModelProxy {
    return new ModelProxy(this.modelName, this.definition, { ...this.context, ...extra });
  }
}

export function env(modelName: string): ModelProxy {
  const registry = getModelRegistry();
  const definition = registry.get(modelName);

  if (!definition) {
    throw new Error(`Model "${modelName}" is not registered.`);
  }

  return new ModelProxy(modelName, definition, { uid: 0, lang: 'en_US' });
}

export function envWithContext(modelName: string, context: EnvContext): ModelProxy {
  const registry = getModelRegistry();
  const definition = registry.get(modelName);

  if (!definition) {
    throw new Error(`Model "${modelName}" is not registered.`);
  }

  return new ModelProxy(modelName, definition, context);
}
