import type { QueryResultRow } from 'pg';

import type { ExecutorOptions } from './db.types.ts';
import type { InsertQueryDescriptor } from './query-builder/query-builder.types.ts';

import { buildInsertQuery } from './query-builder/build-insert-query.util.ts';
import { runQuery } from './run-query.util.ts';

/**
 * A unique or foreign-key rejection arrives as this package's typed errors rather than a
 * raw `pg` message (ADR-050).
 * The array is widened to `readonly` deliberately: pg hands back a mutable array nothing
 * should write to.
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
