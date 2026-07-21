import type {
  BuiltQuery,
  DistinctQueryDescriptor,
} from './queryBuilder.types.ts';

import { assertColumnAllowed } from './assertColumnAllowed.util.ts';
import { assertSafeIdentifier } from './assertSafeIdentifier.util.ts';
import { buildOptionalNumericClauses } from './buildOptionalNumericClauses.util.ts';
import { quoteIdentifier } from './quoteIdentifier.util.ts';

/**
 * Builds a paginated `SELECT DISTINCT` for a single column — the query
 * behind filter-option lists (distinct values of a filterable column).
 * Excludes NULL and empty-string values and orders ascending so pages are
 * stable across requests. Same identifier/authorization model as
 * buildSelectQuery: schema, table, and column always pass
 * assertSafeIdentifier; pass `allowedColumns` the moment the column name is
 * derived from a request.
 */
export const buildDistinctQuery = ({
  allowedColumns,
  column,
  limit,
  offset,
  schema,
  table,
}: DistinctQueryDescriptor): BuiltQuery => {
  assertSafeIdentifier(schema);
  assertSafeIdentifier(table);
  assertSafeIdentifier(column);
  assertColumnAllowed({ allowedColumns, column });

  const quotedColumn = quoteIdentifier(column);
  const quotedFrom = `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;

  const paginationClause = buildOptionalNumericClauses({
    clauses: [
      { keyword: 'LIMIT', value: limit },
      { keyword: 'OFFSET', value: offset },
    ],
    startParamIndex: 1,
  });

  const text = [
    `SELECT DISTINCT ${quotedColumn} AS value FROM ${quotedFrom}`,
    `WHERE ${quotedColumn} IS NOT NULL AND ${quotedColumn}::text != ''`,
    `ORDER BY ${quotedColumn}`,
    paginationClause.text,
  ]
    .filter((part) => part.length > 0)
    .join(' ');

  return { text, values: paginationClause.values };
};
