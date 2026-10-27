import type {
  BuiltQuery,
  SelectQueryDescriptor,
} from './query-builder.types.ts';

import { assertSafeIdentifier } from './assert-safe-identifier.util.ts';
import { buildOptionalNumericClauses } from './build-optional-numeric-clauses.util.ts';
import { buildOrderByClause } from './build-order-by-clause.util.ts';
import { buildProjectedColumn } from './build-projected-column.util.ts';
import { buildWhereClause } from './build-where-clause.util.ts';
import { quoteIdentifier } from './quote-identifier.util.ts';
import { resolveColumnReference } from './resolve-column-reference.util.ts';
import { resolveReadScope } from './resolve-read-scope.util.ts';

export const buildRowsRead = ({
  allowedColumns,
  cursor,
  distinct,
  fields,
  filters,
  joins,
  limit,
  offset,
  relations,
  schema,
  sort,
  table,
}: SelectQueryDescriptor): BuiltQuery => {
  assertSafeIdentifier(schema);
  assertSafeIdentifier(table);

  const scope = resolveReadScope({
    allowedColumns,
    joins,
    relations,
    schema,
    table,
  });
  const quotedFields = fields
    .map((field) => {
      const column = resolveColumnReference({
        allowedColumns,
        reference: field,
        scope,
      });

      return buildProjectedColumn({ ...column, isAliased: column.isJoined });
    })
    .join(', ');
  const quotedFrom =
    scope?.from ?? `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;

  const whereClause = buildWhereClause({
    allowedColumns,
    cursor,
    filters,
    scope,
    sort,
  });
  const orderByClause = buildOrderByClause({ allowedColumns, scope, sort });
  const paginationClause = buildOptionalNumericClauses({
    clauses: [
      { keyword: 'LIMIT', value: limit },
      { keyword: 'OFFSET', value: offset },
    ],
    startParamIndex: whereClause.nextParamIndex,
  });

  const text = [
    `SELECT ${distinct ? 'DISTINCT ' : ''}${quotedFields} FROM ${quotedFrom}`,
    whereClause.text,
    orderByClause,
    paginationClause.text,
  ]
    .filter((part) => part.length > 0)
    .join(' ');

  return {
    text,
    values: [...whereClause.values, ...paginationClause.values],
  };
};
