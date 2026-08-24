import { assertColumnAllowed } from './assert-column-allowed.util.ts';
import { assertSafeIdentifier } from './assert-safe-identifier.util.ts';
import { quoteIdentifier } from './quote-identifier.util.ts';

type BuildReturningClauseArgs = {
  readonly allowedColumns?: readonly string[];
  readonly returning?: readonly string[];
};

/**
 * - The single sentinel `['*']` → `RETURNING *` — the whole affected row, how the
 * executors return rows generically without enumerating columns.
 * `*` is a fixed SQL token, never an identifier, so it bypasses the per-column checks.
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
