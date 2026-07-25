import type { QueryResultRow } from 'pg';

import type { ExecutorOptions } from './db.types.ts';
import type { DeleteQueryDescriptor } from './query-builder/query-builder.types.ts';

import { buildDeleteQuery } from './query-builder/build-delete-query.util.ts';
import { runQuery } from './run-query.util.ts';

/**
 * Builds `descriptor` into a DELETE and runs it. Defaults to `RETURNING *` so
 * the deleted row(s) come back without the caller enumerating columns; pass an
 * explicit `returning` to narrow the projection. The builder refuses an
 * unfiltered DELETE, so a WHERE clause is always present. Same `TRow` contract
 * and `readonly` widening as selectRows.
 *
 * Pass `tx` to run inside a `withTransaction` block; omit it for the pool
 * singleton. A delete blocked by a child row arrives as
 * `ForeignKeyViolationError` rather than a raw `pg` message (ADR-050).
 */
export const deleteRows = async <TRow extends QueryResultRow>({
  tx,
  ...descriptor
}: DeleteQueryDescriptor & ExecutorOptions): Promise<readonly TRow[]> => {
  const { text, values } = buildDeleteQuery({
    ...descriptor,
    returning: descriptor.returning ?? ['*'],
  });
  const result = await runQuery<TRow>({ text, tx, values });

  return result.rows;
};
