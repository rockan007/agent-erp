import { Knex } from 'knex';
import { getKnex } from './connection';

export type DomainOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'like' | 'ilike' | 'in' | 'not in';
export type DomainTuple = [string, DomainOperator, unknown];
export type Domain = DomainTuple[];

export interface QueryOptions {
  columns?: string[];
  domain?: Domain;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export function buildWhereClause(
  builder: Knex.QueryBuilder,
  domain: Domain,
): Knex.QueryBuilder {
  for (const [field, operator, value] of domain) {
    switch (operator) {
      case '=':
        builder.where(field, value);
        break;
      case '!=':
        builder.whereNot(field, value);
        break;
      case '>':
        builder.where(field, '>', value);
        break;
      case '<':
        builder.where(field, '<', value);
        break;
      case '>=':
        builder.where(field, '>=', value);
        break;
      case '<=':
        builder.where(field, '<=', value);
        break;
      case 'like':
        builder.where(field, 'like', value);
        break;
      case 'ilike':
        builder.where(field, 'ilike', value);
        break;
      case 'in':
        builder.whereIn(field, value as unknown[]);
        break;
      case 'not in':
        builder.whereNotIn(field, value as unknown[]);
        break;
    }
  }
  return builder;
}

export function buildQuery(
  tableName: string,
  options: QueryOptions = {},
): Knex.QueryBuilder {
  const knex = getKnex();
  let query = knex(tableName);

  if (options.columns) {
    query = query.select(options.columns);
  }

  if (options.domain && options.domain.length > 0) {
    query = buildWhereClause(query, options.domain);
  }

  if (options.orderBy) {
    query = query.orderBy(options.orderBy, options.orderDir ?? 'asc');
  }

  if (options.limit !== undefined) {
    query = query.limit(options.limit);
  }

  if (options.offset !== undefined) {
    query = query.offset(options.offset);
  }

  return query;
}
