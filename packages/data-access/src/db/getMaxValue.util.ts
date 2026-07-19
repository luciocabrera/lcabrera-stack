import type { MaxValueQueryDescriptor } from './queryBuilder/QueryBuilder.types.ts';

import { getPool } from './getPool.util.ts';
import { buildMaxValueQuery } from './queryBuilder/buildMaxValueQuery.util.ts';

/**
 * Runs buildMaxValueQuery on the pool and returns the numeric maximum of
 * `column` (0 for an empty table, guaranteed by COALESCE). The generic "next
 * id" read for tables without a sequence: callers add 1 to assign the next
 * primary key. Postgres returns wide-integer aggregates as strings, so the
 * value is coerced to a number here.
 */
export const getMaxValue = async (
  descriptor: MaxValueQueryDescriptor,
): Promise<number> => {
  const { text, values } = buildMaxValueQuery(descriptor);
  const result = await getPool().query<{ readonly max: number | string }>(
    text,
    [...values],
  );
  const [row] = result.rows;

  return Number(row?.max ?? 0);
};
