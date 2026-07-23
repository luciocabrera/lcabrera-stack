import type { CountQueryDescriptor } from './query-builder/query-builder.types.ts';

import { getPool } from './get-pool.util.ts';
import { buildCountQuery } from './query-builder/build-count-query.util.ts';

/**
 * Runs buildCountQuery on the pool and returns the matching row count. The
 * sibling of getMaxValue for the "how many rows match?" read — pass the same
 * `filters`/`allowedColumns` as the data query so a page and its total can
 * never drift.
 *
 * `column` is **required** here even though buildCountQuery defaults it to
 * `count(*)`: this executor counts an explicit non-null column — typically the
 * primary key — so the total is unambiguous and never surprises on a nullable
 * column. Postgres returns wide-integer aggregates as strings, so the value is
 * coerced to a number.
 */
export const getRowsCount = async (
  descriptor: CountQueryDescriptor & { readonly column: string },
): Promise<number> => {
  const { text, values } = buildCountQuery(descriptor);
  const result = await getPool().query<{ readonly count: number | string }>(
    text,
    [...values],
  );
  const [row] = result.rows;

  return Number(row?.count ?? 0);
};
