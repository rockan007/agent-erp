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

  for (const model of models) {
    const tableName = model._table ?? model._name.replace(/\./g, '_');
    const hasTable = await knex.schema.hasTable(tableName);

    if (!hasTable) {
      const sql = generateCreateTableSQL(model);
      migrations.push(sql);
    } else {
      const existingColumns = await knex(tableName).columnInfo();
      for (const [name, field] of Object.entries(model.fields)) {
        const colType = fieldToColumnType(field);
        if (colType === 'virtual') continue;
        if (!(name in existingColumns)) {
          const sqlType = mapKnexTypeToSQL(colType);
          migrations.push(
            `ALTER TABLE "${tableName}" ADD COLUMN "${name}" ${sqlType}${field.required ? ' NOT NULL' : ''};`
          );
        }
      }
    }
  }

  return migrations;
}
