import { describe, it, expect } from 'vitest';
import { Model, model, BaseModel, AbstractModel, TransientModel } from '../model';

describe('Model', () => {
  it('should set _definition from @model decorator', () => {
    @model({ _name: 'test.model', _description: 'Test Model' })
    class TestModel extends Model {}

    const def = (TestModel as unknown as typeof BaseModel)._definition;
    expect(def._name).toBe('test.model');
    expect(def._description).toBe('Test Model');
  });

  it('should support _inherit', () => {
    @model({ _name: 'test.child', _inherit: 'test.parent' })
    class ChildModel extends Model {}

    const def = (ChildModel as unknown as typeof BaseModel)._definition;
    expect(def._inherit).toBe('test.parent');
  });

  it('should have correct _type for Model', () => {
    @model({ _name: 'test.type.model' })
    class M extends Model {}
    expect(M._type).toBe('model');
  });

  it('should have correct _type for TransientModel', () => {
    @model({ _name: 'test.type.transient' })
    class M extends TransientModel {}
    expect(M._type).toBe('transient');
  });

  it('should have correct _type for AbstractModel', () => {
    @model({ _name: 'test.type.abstract' })
    class M extends AbstractModel {}
    expect(M._type).toBe('abstract');
  });
});
