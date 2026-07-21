import type {
  BuiltQuery,
  CountQueryDescriptor,
} from './query-builder.types.ts';

import { assertColumnAllowed } from './assert-column-allowed.util.ts';
import { assertSafeIdentifier } from './assert-safe-identifier.util.ts';
import { buildWhereClause } from './build-where-clause.util.ts';
import { quoteIdentifier } from './quote-identifier.util.ts';

/**
 * Builds a `count(<column>)` query reusing the exact same WHERE-building logic
 * as buildSelectQuery, so a caller's data query and count query can never
 * drift apart (pass it the same `filters`/`allowedColumns` given to
 * buildSelectQuery). `column` selects what to count and defaults to `*` (count
 * every matching row); pass a specific column — typically the primary key —
 * for a table with no `id`, or when NULLs in that column should not be counted.
 * A provided `column` is syntax-checked and, when `allowedColumns` is given,
 * authorization-checked just like a filter/sort column.
 */
export const buildCountQuery = ({
  allowedColumns,
  column,
  filters,
  schema,
  table,
}: CountQueryDescriptor): BuiltQuery => {
  assertSafeIdentifier(schema);
  assertSafeIdentifier(table);

  if (column !== undefined) {
    assertSafeIdentifier(column);
    assertColumnAllowed({ allowedColumns, column });
  }

  const countTarget = column === undefined ? '*' : quoteIdentifier(column);
  const whereClause = buildWhereClause({ allowedColumns, filters });
  const quotedFrom = `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;

  const text = [
    `SELECT count(${countTarget}) AS count FROM ${quotedFrom}`,
    whereClause.text,
  ]
    .filter((part) => part.length > 0)
    .join(' ');

  return { text, values: whereClause.values };
};
