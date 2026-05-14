import { ModelDefinition } from './types';
import type { BaseModel } from './model';

export class ModelRegistry {
  private models = new Map<string, ModelDefinition>();
  private classes = new Map<string, typeof BaseModel>();

  register(modelClass: typeof BaseModel): void {
    const def = modelClass._definition;
    if (!def._name) {
      throw new Error('Model must have a _name');
    }
    this.models.set(def._name, def);
    this.classes.set(def._name, modelClass);
  }

  get(name: string): ModelDefinition | undefined {
    const direct = this.models.get(name);
    if (direct) return direct;

    for (const [, def] of this.models.entries()) {
      if (def._inherits && name in def._inherits) {
        return def;
      }
    }

    return undefined;
  }

  getAll(): Map<string, ModelDefinition> {
    return new Map(this.models);
  }

  getClass(name: string): typeof BaseModel | undefined {
    return this.classes.get(name);
  }

  resolveInheritance(name: string): ModelDefinition {
    const def = this.models.get(name);
    if (!def) throw new Error(`Model "${name}" not found`);

    if (def._inherit) {
      const parent = this.resolveInheritance(def._inherit);
      return {
        ...parent,
        ...def,
        fields: { ...parent.fields, ...def.fields },
      };
    }

    return def;
  }

  clear(): void {
    this.models.clear();
    this.classes.clear();
  }
}

let _registry: ModelRegistry | null = null;

export function getModelRegistry(): ModelRegistry {
  if (!_registry) {
    _registry = new ModelRegistry();
  }
  return _registry;
}
