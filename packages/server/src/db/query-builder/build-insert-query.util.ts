import type {
  BuiltQuery,
  InsertQueryDescriptor,
} from './query-builder.types.ts';

import { assertColumnAllowed } from './assert-column-allowed.util.ts';
import { assertSafeIdentifier } from './assert-safe-identifier.util.ts';
import { buildReturningClause } from './build-returning-clause.util.ts';
import { quoteIdentifier } from './quote-identifier.util.ts';

/**
 * Generic, schema/table-agnostic INSERT builder — the write-side twin of
 * buildSelectQuery. Turns a `{ schema, table, values }` descriptor into
 * `INSERT INTO schema.table (cols) VALUES ($1, $2, …) [RETURNING …]`.
 *
 * Every column key runs through assertSafeIdentifier (always) plus the opt-in
 * assertColumnAllowed, then is double-quoted via quoteIdentifier; every value
 * is a bound `$n` parameter, never interpolated. `returning` is delegated to
 * buildReturningClause (`['*']` for the whole row, or an explicit column list).
 */
export const buildInsertQuery = ({
  allowedColumns,
  returning,
  schema,
  table,
  values,
}: InsertQueryDescriptor): BuiltQuery => {
  assertSafeIdentifier(schema);
  assertSafeIdentifier(table);

  const entries = Object.entries(values);

  if (entries.length === 0) {
    throw new Error('buildInsertQuery requires at least one column to insert.');
  }

  const columns = entries.map(([column]) => column);

  for (const column of columns) {
    assertSafeIdentifier(column);
    assertColumnAllowed({ allowedColumns, column });
  }

  const quotedColumns = columns
    .map((column) => quoteIdentifier(column))
    .join(', ');
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const quotedInto = `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;
  const returningClause = buildReturningClause({ allowedColumns, returning });

  const text = [
    `INSERT INTO ${quotedInto} (${quotedColumns}) VALUES (${placeholders})`,
    returningClause,
  ]
    .filter((part) => part.length > 0)
    .join(' ');

  return { text, values: entries.map(([, value]) => value) };
};
