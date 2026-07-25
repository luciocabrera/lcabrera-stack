import type { ExecutorOptions } from './db.types.ts';
import type { MaxValueQueryDescriptor } from './query-builder/query-builder.types.ts';

import { buildMaxValueQuery } from './query-builder/build-max-value-query.util.ts';
import { runQuery } from './run-query.util.ts';

/**
 * Runs buildMaxValueQuery and returns the numeric maximum of `column` (0 for an
 * empty table, guaranteed by COALESCE). The generic "next id" read for tables
 * without a sequence: callers add 1 to assign the next primary key. Postgres
 * returns wide-integer aggregates as strings, so the value is coerced to a
 * number here.
 *
 * Pass `tx` to read on the same connection as the INSERT that consumes the
 * value. That is necessary for an atomic allocation and, on its own, **not
 * sufficient** — under READ COMMITTED two transactions can still read the same
 * maximum. ADR-051 picks the lock/retry strategy that closes the window.
 */
export const getMaxValue = async ({
  tx,
  ...descriptor
}: ExecutorOptions & MaxValueQueryDescriptor): Promise<number> => {
  const { text, values } = buildMaxValueQuery(descriptor);
  const result = await runQuery<{ readonly max: number | string }>({
    text,
    tx,
    values,
  });
  const [row] = result.rows;

  return Number(row?.max ?? 0);
};
