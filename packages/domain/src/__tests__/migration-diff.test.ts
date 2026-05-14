import { describe, it, expect } from 'vitest';
import { generateCreateTableSQL } from '../migration-diff';
import { ModelDefinition } from '../types';

describe('generateCreateTableSQL', () => {
  it('should generate CREATE TABLE', () => {
    const model: ModelDefinition = {
      _name: 'test.basic',
      _description: 'Basic test',
      fields: {
        name: { name: 'name', type: 'char', required: true },
        description: { name: 'description', type: 'text' },
        price: { name: 'price', type: 'float' },
        active: { name: 'active', type: 'boolean' },
      },
    };

    const sql = generateCreateTableSQL(model);
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "test_basic"');
    expect(sql).toContain('id SERIAL PRIMARY KEY');
    expect(sql).toContain('"name" VARCHAR(255) NOT NULL');
    expect(sql).toContain('"description" TEXT');
    expect(sql).toContain('"price" DOUBLE PRECISION');
  });

  it('should skip virtual fields (one2many, many2many)', () => {
    const model: ModelDefinition = {
      _name: 'test.virtual',
      _description: 'Virtual test',
      fields: {
        name: { name: 'name', type: 'char' },
        lines: { name: 'lines', type: 'one2many', comodel: 'test.line', inverse_field: 'parent_id' },
        tags: { name: 'tags', type: 'many2many', comodel: 'test.tag' },
      },
    };

    const sql = generateCreateTableSQL(model);
    expect(sql).not.toContain('lines');
    expect(sql).not.toContain('tags');
  });

  it('should handle json type as jsonb', () => {
    const model: ModelDefinition = {
      _name: 'test.json',
      _description: 'JSON test',
      fields: {
        metadata: { name: 'metadata', type: 'json' },
      },
    };

    const sql = generateCreateTableSQL(model);
    expect(sql).toContain('"metadata" JSONB');
  });
});
