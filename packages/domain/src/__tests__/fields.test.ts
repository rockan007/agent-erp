import { describe, it, expect } from 'vitest';
import 'reflect-metadata';
import { fields } from '../fields';
import { FieldDefinition } from '../types';

describe('fields', () => {
  it('should store field metadata', () => {
    class TestModel {
      @fields.char({ required: true })
      name!: string;

      @fields.integer({ default: 0 })
      count!: number;
    }

    const meta = Reflect.getMetadata('fields', TestModel.prototype) as Record<string, FieldDefinition>;
    expect(meta.name).toMatchObject({ type: 'char', required: true });
    expect(meta.count).toMatchObject({ type: 'integer', default: 0 });
  });

  it('many2one should store comodel', () => {
    class TestRel {
      @fields.many2one({ comodel: 'res.partner' })
      partner_id!: number;
    }

    const meta = Reflect.getMetadata('fields', TestRel.prototype) as Record<string, FieldDefinition>;
    expect(meta.partner_id).toMatchObject({ type: 'many2one', comodel: 'res.partner' });
  });

  it('selection should store options', () => {
    class TestSel {
      @fields.selection([['draft', 'Draft'], ['done', 'Done']])
      state!: string;
    }

    const meta = Reflect.getMetadata('fields', TestSel.prototype) as Record<string, FieldDefinition>;
    expect(meta.state!.selection).toEqual([['draft', 'Draft'], ['done', 'Done']]);
  });

  it('one2many should store comodel and inverse_field', () => {
    class TestO2M {
      @fields.one2many({ comodel: 'test.line', inverse_field: 'parent_id' })
      line_ids!: number[];
    }

    const meta = Reflect.getMetadata('fields', TestO2M.prototype) as Record<string, FieldDefinition>;
    expect(meta.line_ids).toMatchObject({ type: 'one2many', comodel: 'test.line', inverse_field: 'parent_id' });
  });
});
