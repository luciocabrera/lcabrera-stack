import type { ExecutorOptions } from './db.types.ts';
import type { CountQueryDescriptor } from './query-builder/query-builder.types.ts';

import { buildReadQuery } from './query-builder/build-read-query.util.ts';
import { runQuery } from './run-query.util.ts';

export const getRowsCount = async ({
  tx,
  ...descriptor
}: CountQueryDescriptor &
  ExecutorOptions & { readonly column: string }): Promise<number> => {
  const { text, values } = buildReadQuery({ ...descriptor, count: true });
  const result = await runQuery<{ readonly count: number | string }>({
    text,
    tx,
    values,
  });
  const [row] = result.rows;

  return Number(row?.count ?? 0);
};
