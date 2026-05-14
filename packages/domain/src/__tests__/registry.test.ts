import { describe, it, expect, beforeEach } from 'vitest';
import { ModelRegistry, getModelRegistry } from '../registry';
import { Model, model, BaseModel } from '../model';

describe('ModelRegistry', () => {
  let registry: ModelRegistry;

  beforeEach(() => {
    registry = new ModelRegistry();
  });

  it('should register and retrieve model definition', () => {
    @model({ _name: 'test.model', _description: 'Test' })
    class TestModel extends Model {}

    registry.register(TestModel as unknown as typeof BaseModel);
    const def = registry.get('test.model');
    expect(def?._name).toBe('test.model');
  });

  it('should resolve inheritance chains', () => {
    @model({ _name: 'test.parent', _description: 'Parent' })
    class Parent extends Model {}

    @model({ _name: 'test.child', _inherit: 'test.parent' })
    class Child extends Model {}

    registry.register(Parent as unknown as typeof BaseModel);
    registry.register(Child as unknown as typeof BaseModel);

    const resolved = registry.resolveInheritance('test.child');
    expect(resolved._name).toBe('test.child');
  });

  it('getAll should return all models', () => {
    @model({ _name: 'a.model' }) class A extends Model {}
    @model({ _name: 'b.model' }) class B extends Model {}
    registry.register(A as unknown as typeof BaseModel);
    registry.register(B as unknown as typeof BaseModel);
    expect(registry.getAll().size).toBe(2);
  });

  it('should throw when registering model without _name', () => {
    // Craft an invalid model class
    const BadModel = class extends Model {};
    (BadModel as unknown as typeof BaseModel)._definition = { _name: '', _description: '', fields: {} };
    expect(() => registry.register(BadModel as unknown as typeof BaseModel)).toThrow('Model must have a _name');
  });
});
