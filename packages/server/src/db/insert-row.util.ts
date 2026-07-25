import type { QueryResultRow } from 'pg';

import type { ExecutorOptions } from './db.types.ts';
import type { InsertQueryDescriptor } from './query-builder/query-builder.types.ts';

import { buildInsertQuery } from './query-builder/build-insert-query.util.ts';
import { runQuery } from './run-query.util.ts';

/**
 * Builds `descriptor` into an INSERT and runs it — the write-side twin of
 * selectRows. Defaults to `RETURNING *` so the inserted row(s) come back without
 * the caller enumerating columns; pass an explicit `returning` on the descriptor
 * to narrow the projection.
 *
 * Pass `tx` to run inside a `withTransaction` block; omit it for the pool
 * singleton. A unique or foreign-key rejection arrives as this package's typed
 * errors rather than a raw `pg` message (ADR-050).
 *
 * `TRow` is the same unchecked contract selectRows documents — pg does not
 * validate it, and `numeric` columns arrive as strings. The array is widened
 * to `readonly` deliberately: pg hands back a mutable array nothing should
 * write to.
 */
export const insertRow = async <TRow extends QueryResultRow>({
  tx,
  ...descriptor
}: ExecutorOptions & InsertQueryDescriptor): Promise<readonly TRow[]> => {
  const { text, values } = buildInsertQuery({
    ...descriptor,
    returning: descriptor.returning ?? ['*'],
  });
  const result = await runQuery<TRow>({ text, tx, values });

  return result.rows;
};
