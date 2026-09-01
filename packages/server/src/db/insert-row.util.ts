import type { QueryResultRow } from 'pg';

import type { ExecutorOptions } from './db.types.ts';
import type { InsertQueryDescriptor } from './query-builder/query-builder.types.ts';

import { buildInsertQuery } from './query-builder/build-insert-query.util.ts';
import { runQuery } from './run-query.util.ts';

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
