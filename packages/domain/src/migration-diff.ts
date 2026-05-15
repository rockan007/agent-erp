import { Knex } from 'knex';
import { FieldDefinition, ModelDefinition } from './types';

function fieldToColumnType(field: FieldDefinition): string {
  switch (field.type) {
    case 'char': return 'string';
    case 'text': case 'html': return 'text';
    case 'integer': case 'many2one': case 'reference': return 'integer';
    case 'float': case 'monetary': return 'float';
    case 'boolean': return 'boolean';
    case 'date': return 'date';
    case 'datetime': return 'datetime';
    case 'binary': return 'binary';
    case 'selection': return 'string';
    case 'json': return 'jsonb';
    case 'image': return 'text';
    case 'one2many': case 'many2many': return 'virtual';
    default: return 'string';
  }
}

function mapKnexTypeToSQL(knexType: string): string {
  const map: Record<string, string> = {
    string: 'VARCHAR(255)',
    text: 'TEXT',
    integer: 'INTEGER',
    float: 'DOUBLE PRECISION',
    boolean: 'BOOLEAN',
    date: 'DATE',
    datetime: 'TIMESTAMP',
    binary: 'BYTEA',
    jsonb: 'JSONB',
  };
  return map[knexType] ?? 'TEXT';
}

export function generateCreateTableSQL(model: ModelDefinition): string {
  const tableName = model._table ?? model._name.replace(/\./g, '_');
  const columns: string[] = ['id SERIAL PRIMARY KEY'];

  for (const [name, field] of Object.entries(model.fields)) {
    const colType = fieldToColumnType(field);
    if (colType === 'virtual') continue;
    let colDef = `"${name}" ${mapKnexTypeToSQL(colType)}`;
    if (field.required) colDef += ' NOT NULL';
    columns.push(colDef);
  }

  return `CREATE TABLE IF NOT EXISTS "${tableName}" (\n  ${columns.join(',\n  ')}\n);`;
}

export async function diffAndMigrate(
  knex: Knex,
  models: ModelDefinition[],
): Promise<string[]> {
  const migrations: string[] = [];

  // Pass 1: create main tables and add missing columns
  for (const model of models) {
    const tableName = model._table ?? model._name.replace(/\./g, '_');
    const hasTable = await knex.schema.hasTable(tableName);

    if (!hasTable) {
      const sql = generateCreateTableSQL(model);
      await knex.raw(sql);
      migrations.push(sql);
    } else {
      const existingColumns = await knex(tableName).columnInfo();
      for (const [name, field] of Object.entries(model.fields)) {
        const colType = fieldToColumnType(field);
        if (colType === 'virtual') continue;
        if (!(name in existingColumns)) {
          const sqlType = mapKnexTypeToSQL(colType);
          const sql = `ALTER TABLE "${tableName}" ADD COLUMN "${name}" ${sqlType}${field.required ? ' NOT NULL' : ''};`;
          await knex.raw(sql);
          migrations.push(sql);
        }
      }
    }
  }

  // Pass 2: create many2many junction tables (after all main tables exist)
  for (const model of models) {
    const tableName = model._table ?? model._name.replace(/\./g, '_');

    for (const [, field] of Object.entries(model.fields)) {
      if (field.type !== 'many2many') continue;
      const junctionTable = field.table ?? `${tableName}_${field.comodel?.replace(/\./g, '_')}_rel`;
      const col1 = field.column1 ?? `${model._name.replace(/\./g, '_')}_id`;
      const col2 = field.column2 ?? `${field.comodel?.replace(/\./g, '_')}_id`;

      const hasJunction = await knex.schema.hasTable(junctionTable);
      if (!hasJunction) {
        const sql = `CREATE TABLE IF NOT EXISTS "${junctionTable}" (\n  "${col1}" INTEGER NOT NULL,\n  "${col2}" INTEGER NOT NULL,\n  PRIMARY KEY ("${col1}", "${col2}")\n);`;
        await knex.raw(sql);
        migrations.push(sql);
      }
    }
  }

  return migrations;
}
