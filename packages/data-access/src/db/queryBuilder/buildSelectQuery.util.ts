import type {
  BuiltQuery,
  SelectQueryDescriptor,
} from './QueryBuilder.types.ts';

import { assertColumnAllowed } from './assertColumnAllowed.util.ts';
import { assertSafeIdentifier } from './assertSafeIdentifier.util.ts';
import { buildOptionalNumericClauses } from './buildOptionalNumericClauses.util.ts';
import { buildOrderByClause } from './buildOrderByClause.util.ts';
import { buildWhereClause } from './buildWhereClause.util.ts';
import { quoteIdentifier } from './quoteIdentifier.util.ts';

/**
 * Generic, schema/table-agnostic SELECT builder for the "flat list view,
 * optional filter/sort/pagination" shape — not joins, subqueries, raw SQL
 * fragments, or write mutations (see this folder's ARCHITECTURE.md).
 *
 * Every identifier (schema, table, each field/filter/sort column) is
 * checked via assertSafeIdentifier unconditionally. `allowedColumns` is an
 * additional, opt-in authorization check — omit it when every column here
 * is developer-hardcoded; pass it the moment a column name is ever derived
 * from a request (see QueryBuilder.types.ts's SelectQueryDescriptor doc).
 */
export const buildSelectQuery = ({
  allowedColumns,
  fields,
  filters,
  limit,
  offset,
  schema,
  sort,
  table,
}: SelectQueryDescriptor): BuiltQuery => {
  assertSafeIdentifier(schema);
  assertSafeIdentifier(table);

  for (const field of fields) {
    assertSafeIdentifier(field);
    assertColumnAllowed({ allowedColumns, column: field });
  }

  const quotedFields = fields.map((field) => quoteIdentifier(field)).join(', ');
  const quotedFrom = `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;

  const whereClause = buildWhereClause({ allowedColumns, filters });
  const orderByClause = buildOrderByClause({ allowedColumns, sort });
  const paginationClause = buildOptionalNumericClauses({
    clauses: [
      { keyword: 'LIMIT', value: limit },
      { keyword: 'OFFSET', value: offset },
    ],
    startParamIndex: whereClause.nextParamIndex,
  });

  const text = [
    `SELECT ${quotedFields} FROM ${quotedFrom}`,
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
