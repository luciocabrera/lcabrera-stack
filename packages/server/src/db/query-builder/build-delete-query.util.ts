import type {
  BuiltQuery,
  DeleteQueryDescriptor,
} from './query-builder.types.ts';

import { assertSafeIdentifier } from './assert-safe-identifier.util.ts';
import { buildReturningClause } from './build-returning-clause.util.ts';
import { buildWhereClause } from './build-where-clause.util.ts';
import { quoteIdentifier } from './quote-identifier.util.ts';

/**
 * Generic, schema/table-agnostic DELETE builder. Turns
 * `{ schema, table, filters }` into
 * `DELETE FROM schema.table WHERE … [RETURNING …]`.
 *
 * Reuses the shared buildWhereClause, so filter columns and `$n` parameters
 * behave exactly as in the read builders. At least one filter is required — an
 * unfiltered DELETE (which would empty the table) is refused outright.
 */
export const buildDeleteQuery = ({
  allowedColumns,
  filters,
  returning,
  schema,
  table,
}: DeleteQueryDescriptor): BuiltQuery => {
  assertSafeIdentifier(schema);
  assertSafeIdentifier(table);

  if (filters.length === 0) {
    throw new Error(
      'buildDeleteQuery requires at least one filter; refusing to build an unfiltered DELETE.',
    );
  }

  const quotedTarget = `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;
  const whereClause = buildWhereClause({ allowedColumns, filters });
  const returningClause = buildReturningClause({ allowedColumns, returning });

  const text = [
    `DELETE FROM ${quotedTarget}`,
    whereClause.text,
    returningClause,
  ]
    .filter((part) => part.length > 0)
    .join(' ');

  return { text, values: whereClause.values };
};
