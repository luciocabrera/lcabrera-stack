import type { ExecutorOptions } from './db.types.ts';
import type { CountQueryDescriptor } from './query-builder/query-builder.types.ts';

import { buildCountQuery } from './query-builder/build-count-query.util.ts';
import { runQuery } from './run-query.util.ts';

export const getRowsCount = async ({
  tx,
  ...descriptor
}: CountQueryDescriptor &
  ExecutorOptions & { readonly column: string }): Promise<number> => {
  const { text, values } = buildCountQuery(descriptor);
  const result = await runQuery<{ readonly count: number | string }>({
    text,
    tx,
    values,
  });
  const [row] = result.rows;

  return Number(row?.count ?? 0);
};
