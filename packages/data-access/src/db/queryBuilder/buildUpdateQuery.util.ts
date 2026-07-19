import type {
  BuiltQuery,
  UpdateQueryDescriptor,
} from './QueryBuilder.types.ts';

import { assertColumnAllowed } from './assertColumnAllowed.util.ts';
import { assertSafeIdentifier } from './assertSafeIdentifier.util.ts';
import { buildReturningClause } from './buildReturningClause.util.ts';
import { buildWhereClause } from './buildWhereClause.util.ts';
import { quoteIdentifier } from './quoteIdentifier.util.ts';

/**
 * Generic, schema/table-agnostic UPDATE builder. Turns
 * `{ schema, table, values, filters }` into
 * `UPDATE schema.table SET col = $n, … WHERE … [RETURNING …]`.
 *
 * The SET assignments own `$1…$k`; the WHERE clause is delegated to the shared
 * buildWhereClause with `startParamIndex` set past them, so SET and WHERE
 * parameters never collide. At least one filter is required — an unfiltered
 * UPDATE (which would rewrite every row) is refused outright. Same
 * identifier/value safety as buildInsertQuery.
 */
export const buildUpdateQuery = ({
  allowedColumns,
  filters,
  returning,
  schema,
  table,
  values,
}: UpdateQueryDescriptor): BuiltQuery => {
  assertSafeIdentifier(schema);
  assertSafeIdentifier(table);

  if (filters.length === 0) {
    throw new Error(
      'buildUpdateQuery requires at least one filter; refusing to build an unfiltered UPDATE.',
    );
  }

  const entries = Object.entries(values);

  if (entries.length === 0) {
    throw new Error('buildUpdateQuery requires at least one column to update.');
  }

  const columns = entries.map(([column]) => column);

  for (const column of columns) {
    assertSafeIdentifier(column);
    assertColumnAllowed({ allowedColumns, column });
  }

  const setClause = columns
    .map((column, index) => `${quoteIdentifier(column)} = $${index + 1}`)
    .join(', ');
  const quotedTarget = `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;
  const whereClause = buildWhereClause({
    allowedColumns,
    filters,
    startParamIndex: entries.length + 1,
  });
  const returningClause = buildReturningClause({ allowedColumns, returning });

  const text = [
    `UPDATE ${quotedTarget} SET ${setClause}`,
    whereClause.text,
    returningClause,
  ]
    .filter((part) => part.length > 0)
    .join(' ');

  return {
    text,
    values: [...entries.map(([, value]) => value), ...whereClause.values],
  };
};
