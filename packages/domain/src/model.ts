import 'reflect-metadata';
import { ModelDefinition } from './types';
import { getModelRegistry } from './registry';

export abstract class BaseModel {
  static _definition: ModelDefinition = { _name: '', _description: '', fields: {} };

  static _register(): void {
    getModelRegistry().register(this as unknown as typeof BaseModel);
  }
}

export class Model extends BaseModel {
  static _type = 'model' as const;
}

export class TransientModel extends BaseModel {
  static _type = 'transient' as const;
}

export class AbstractModel extends BaseModel {
  static _type = 'abstract' as const;
}

export type ModelConstructor = typeof Model | typeof TransientModel | typeof AbstractModel;

export function model(config: {
  _name: string;
  _description?: string;
  _inherit?: string;
  _inherits?: Record<string, string>;
}) {
  return function <T extends { new (...args: unknown[]): object }>(target: T) {
    const proto = target.prototype as Record<string, unknown>;
    const fieldMetadata: Record<string, unknown> =
      (Reflect.getMetadata('fields', proto) as Record<string, unknown>) ?? {};

    (target as unknown as typeof BaseModel)._definition = {
      _name: config._name,
      _description: config._description ?? '',
      _inherit: config._inherit,
      _inherits: config._inherits,
      fields: fieldMetadata as ModelDefinition['fields'],
    };
  };
}
