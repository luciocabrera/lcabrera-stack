import { assertColumnAllowed } from './assert-column-allowed.util.ts';
import { assertSafeIdentifier } from './assert-safe-identifier.util.ts';
import { quoteIdentifier } from './quote-identifier.util.ts';

type BuildReturningClauseArgs = {
  readonly allowedColumns?: readonly string[];
  readonly returning?: readonly string[];
};

/**
 * Shared `RETURNING` builder for the write builders (insert/update/delete).
 *
 * - Omitted or empty `returning` → `''` (no clause; the write returns no rows).
 * - The single sentinel `['*']` → `RETURNING *` — the whole affected row, how
 *   the executors return rows generically without enumerating columns. `*` is a
 *   fixed SQL token, never an identifier, so it bypasses the per-column checks.
 * - Any other list is an explicit projection: each column passes
 *   assertSafeIdentifier plus the opt-in assertColumnAllowed, then is quoted.
 *
 * `*` mixed with real column names is rejected — it is only valid on its own.
 */
export const buildReturningClause = ({
  allowedColumns,
  returning,
}: BuildReturningClauseArgs): string => {
  if (returning === undefined || returning.length === 0) {
    return '';
  }

  if (returning.length === 1 && returning[0] === '*') {
    return 'RETURNING *';
  }

  const quotedColumns = returning.map((column) => {
    if (column === '*') {
      throw new Error(
        'RETURNING "*" must be the only entry; it cannot be mixed with column names.',
      );
    }

    assertSafeIdentifier(column);
    assertColumnAllowed({ allowedColumns, column });

    return quoteIdentifier(column);
  });

  return `RETURNING ${quotedColumns.join(', ')}`;
};
