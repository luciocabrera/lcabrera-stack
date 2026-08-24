import type { QueryResultRow } from 'pg';

import type { ExecutorOptions } from './db.types.ts';
import type { SelectQueryDescriptor } from './query-builder/query-builder.types.ts';

import { buildSelectQuery } from './query-builder/build-select-query.util.ts';
import { runQuery } from './run-query.util.ts';

/**
 * Builds `descriptor` into SQL and runs it — the "build it, then execute it" half that
 * every list/rollup read otherwise re-wires by hand.
 * `query-builder/` stays deliberately pure and DB-free (see its `ARCHITECTURE.md`), so
 * something has to join it to a connection.
 */
export const selectRows = async <TRow extends QueryResultRow>({
  tx,
  ...descriptor
}: ExecutorOptions & SelectQueryDescriptor): Promise<readonly TRow[]> => {
  const { text, values } = buildSelectQuery(descriptor);
  const result = await runQuery<TRow>({ text, tx, values });

  return result.rows;
};
