import type { QueryResultRow } from 'pg';

import type { ExecutorOptions } from './db.types.ts';
import type { UpdateQueryDescriptor } from './query-builder/query-builder.types.ts';

import { buildUpdateQuery } from './query-builder/build-update-query.util.ts';
import { runQuery } from './run-query.util.ts';

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
