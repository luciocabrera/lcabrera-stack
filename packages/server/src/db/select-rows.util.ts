import type { QueryResultRow } from 'pg';

import type { ExecutorOptions } from './db.types.ts';
import type { SelectQueryDescriptor } from './query-builder/query-builder.types.ts';

import { buildSelectQuery } from './query-builder/build-select-query.util.ts';
import { runQuery } from './run-query.util.ts';

/**
 * Builds `descriptor` into SQL and runs it — the "build it, then execute it"
 * half that every list/rollup read otherwise re-wires by hand.
 *
 * `query-builder/` stays deliberately pure and DB-free (see its
 * `ARCHITECTURE.md`), so something has to join it to a connection. `runQuery` is
 * that one place: callers declare *what* they want and never restate *how* it
 * runs. Pass `tx` to read inside a transaction — including its own uncommitted
 * writes — and omit it for the pool singleton.
 *
 * `TRow` is an unchecked contract with the view — pg does not validate it.
 * Note `numeric` columns arrive as **strings**, not numbers: type them
 * `string` here and coerce at the caller.
 *
 * The return type is widened to `readonly` deliberately: pg hands back a
 * mutable array, and nothing downstream should be writing to it.
 */
export const selectRows = async <TRow extends QueryResultRow>({
  tx,
  ...descriptor
}: ExecutorOptions & SelectQueryDescriptor): Promise<readonly TRow[]> => {
  const { text, values } = buildSelectQuery(descriptor);
  const result = await runQuery<TRow>({ text, tx, values });

  return result.rows;
};
