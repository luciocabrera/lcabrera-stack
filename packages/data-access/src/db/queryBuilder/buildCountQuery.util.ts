import type { BuiltQuery, CountQueryDescriptor } from './QueryBuilder.types.ts';

import { assertSafeIdentifier } from './assertSafeIdentifier.util.ts';
import { buildWhereClause } from './buildWhereClause.util.ts';
import { quoteIdentifier } from './quoteIdentifier.util.ts';

/**
 * Builds a `count(id)` query reusing the exact same WHERE-building logic as
 * buildSelectQuery, so a caller's data query and count query can never
 * drift apart (the pain point in getScanFindings.util.ts this replaces —
 * pass it the same `filters`/`allowedColumns` given to buildSelectQuery).
 * Assumes the target table/view has an `id` column, true of every
 * fact-table-style view this builder targets.
 */
export const buildCountQuery = ({
  allowedColumns,
  filters,
  schema,
  table,
}: CountQueryDescriptor): BuiltQuery => {
  assertSafeIdentifier(schema);
  assertSafeIdentifier(table);

  const whereClause = buildWhereClause({ allowedColumns, filters });
  const quotedFrom = `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;

  const text = [
    `SELECT count(id) AS count FROM ${quotedFrom}`,
    whereClause.text,
  ]
    .filter((part) => part.length > 0)
    .join(' ');

  return { text, values: whereClause.values };
};
