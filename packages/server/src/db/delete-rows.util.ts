import type { QueryResultRow } from 'pg';

import type { ExecutorOptions } from './db.types.ts';
import type { DeleteQueryDescriptor } from './query-builder/query-builder.types.ts';

import { buildDeleteQuery } from './query-builder/build-delete-query.util.ts';
import { runQuery } from './run-query.util.ts';

/**
 * A delete blocked by a child row arrives as `ForeignKeyViolationError` rather than a raw
 * `pg` message (ADR-050).
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
