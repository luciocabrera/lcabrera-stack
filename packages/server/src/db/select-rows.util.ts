import type { QueryResultRow } from 'pg';

import type { ExecutorOptions } from './db.types.ts';
import type { SelectQueryDescriptor } from './query-builder/query-builder.types.ts';

import { buildRowsRead } from './query-builder/build-rows-read.util.ts';
import { resolveReadRelations } from './resolve-read-relations.util.ts';
import { runQuery } from './run-query.util.ts';

export const selectRows = async <TRow extends QueryResultRow>({
  tx,
  ...descriptor
}: ExecutorOptions & SelectQueryDescriptor): Promise<readonly TRow[]> => {
  const relations = await resolveReadRelations({ ...descriptor, tx });
  const { text, values } = buildRowsRead({
    ...descriptor,
    ...(relations !== undefined && { relations }),
  });
  const result = await runQuery<TRow>({ text, tx, values });

  return result.rows;
};
