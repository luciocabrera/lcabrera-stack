import type {
  BuiltQuery,
  SelectQueryDescriptor,
} from './query-builder.types.ts';

import { assertColumnAllowed } from './assert-column-allowed.util.ts';
import { assertSafeIdentifier } from './assert-safe-identifier.util.ts';
import { buildOptionalNumericClauses } from './build-optional-numeric-clauses.util.ts';
import { buildOrderByClause } from './build-order-by-clause.util.ts';
import { buildWhereClause } from './build-where-clause.util.ts';
import { quoteIdentifier } from './quote-identifier.util.ts';

/**
 * Generic, schema/table-agnostic SELECT builder for the "flat list view,
 * optional filter/sort/pagination" shape — not joins, subqueries, raw SQL
 * fragments, or write mutations (see this folder's ARCHITECTURE.md).
 *
 * Every identifier (schema, table, each field/filter/sort column) is
 * checked via assertSafeIdentifier unconditionally. `allowedColumns` is an
 * additional, opt-in authorization check — omit it when every column here
 * is developer-hardcoded; pass it the moment a column name is ever derived
 * from a request (see query-builder.types.ts's SelectQueryDescriptor doc).
 *
 * Pagination is `offset` by default. Pass `cursor` instead for keyset ("seek")
 * pagination over a total order — O(limit) rather than O(offset), for
 * infinite scroll (ADR-052).
 */
export const buildSelectQuery = ({
  allowedColumns,
  cursor,
  distinct,
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

  const whereClause = buildWhereClause({
    allowedColumns,
    cursor,
    filters,
    sort,
  });
  const orderByClause = buildOrderByClause({ allowedColumns, sort });
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
