import { describe, it, expect } from 'vitest';
import 'reflect-metadata';
import { api } from '../api-decorators';

describe('api decorators', () => {
  it('compute should store metadata', () => {
    class Test {
      @api.compute({ depends: ['price', 'qty'] })
      total(_record: Record<string, unknown>) {
        return 0;
      }
    }

    const computes = Reflect.getMetadata('computes', Test.prototype) as Record<string, unknown>;
    expect(computes.total).toEqual({ depends: ['price', 'qty'] });
  });

  it('constrains should store metadata', () => {
    class Test {
      @api.constrains({ message: 'Invalid value' })
      check() {}
    }

    const constraints = Reflect.getMetadata('constraints', Test.prototype) as Record<string, unknown>;
    expect(constraints.check).toEqual({ message: 'Invalid value' });
  });

  it('onchange should store field list', () => {
    class Test {
      @api.onchange(['partner_id'])
      onPartnerChange() {}
    }

    const onchanges = Reflect.getMetadata('onchanges', Test.prototype) as Record<string, string[]>;
    expect(onchanges.onPartnerChange).toEqual(['partner_id']);
  });
});
