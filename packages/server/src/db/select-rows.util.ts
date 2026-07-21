import type { QueryResultRow } from 'pg';

import type { SelectQueryDescriptor } from './query-builder/query-builder.types.ts';

import { getPool } from './get-pool.util.ts';
import { buildSelectQuery } from './query-builder/build-select-query.util.ts';

/**
 * Builds `descriptor` into SQL and runs it on the pool singleton — the
 * "build it, then execute it" half that every list/rollup read otherwise
 * re-wires by hand.
 *
 * `query-builder/` stays deliberately pure and DB-free (see its
 * `ARCHITECTURE.md`), so something has to join it to `getPool`. This is that
 * one place: callers declare *what* they want and never restate *how* it runs.
 *
 * `TRow` is an unchecked contract with the view — pg does not validate it.
 * Note `numeric` columns arrive as **strings**, not numbers: type them
 * `string` here and coerce at the caller (see scan-ingestion's
 * `selectLlmCostRows.util.ts`).
 *
 * The return type is widened to `readonly` deliberately: pg hands back a
 * mutable array, and nothing downstream should be writing to it.
 */
export const selectRows = async <TRow extends QueryResultRow>(
  descriptor: SelectQueryDescriptor,
): Promise<readonly TRow[]> => {
  const { text, values } = buildSelectQuery(descriptor);
  const result = await getPool().query<TRow>(text, [...values]);

  return result.rows;
};
