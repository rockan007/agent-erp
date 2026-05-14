import { describe, it, expect, beforeEach } from 'vitest';
import { Env, env } from '../env';
import { getModelRegistry } from '../registry';
import { Model, model, BaseModel } from '../model';

describe('Env', () => {
  it('should create Env with context', () => {
    const e = new Env({ uid: 1, lang: 'zh_CN' });
    expect(e.uid).toBe(1);
    expect(e.getContext().lang).toBe('zh_CN');
  });

  it('withContext should merge and return new Env', () => {
    const e = new Env({ uid: 1 });
    const e2 = e.withContext({ lang: 'fr' });
    expect(e2.getContext().lang).toBe('fr');
    expect(e.getContext().lang).toBeUndefined();
  });
});

describe('env()', () => {
  beforeEach(() => {
    getModelRegistry().clear();
  });

  it('should throw for unregistered model', () => {
    expect(() => env('nonexistent.model')).toThrow('not registered');
  });

  it('should return ModelProxy for registered model', () => {
    @model({ _name: 'env.test' })
    class TestModel extends Model {}

    const registry = getModelRegistry();
    registry.register(TestModel as unknown as typeof BaseModel);

    // env() should not throw
    expect(() => env('env.test')).not.toThrow();
  });
});
