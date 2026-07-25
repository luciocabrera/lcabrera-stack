import type { QueryResultRow } from 'pg';

import type { ExecutorOptions } from './db.types.ts';
import type { UpdateQueryDescriptor } from './query-builder/query-builder.types.ts';

import { buildUpdateQuery } from './query-builder/build-update-query.util.ts';
import { runQuery } from './run-query.util.ts';

/**
 * Builds `descriptor` into an UPDATE and runs it. Defaults to `RETURNING *` so
 * the updated row(s) come back without the caller enumerating columns; pass an
 * explicit `returning` to narrow the projection. The builder refuses an
 * unfiltered UPDATE, so a WHERE clause is always present. Same `TRow` contract
 * and `readonly` widening as selectRows.
 *
 * Pass `tx` to run inside a `withTransaction` block; omit it for the pool
 * singleton. Constraint rejections arrive translated (ADR-050).
 */
export const updateRows = async <TRow extends QueryResultRow>({
  tx,
  ...descriptor
}: ExecutorOptions & UpdateQueryDescriptor): Promise<readonly TRow[]> => {
  const { text, values } = buildUpdateQuery({
    ...descriptor,
    returning: descriptor.returning ?? ['*'],
  });
  const result = await runQuery<TRow>({ text, tx, values });

  return result.rows;
};
