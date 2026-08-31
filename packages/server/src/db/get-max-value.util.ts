import type { ExecutorOptions } from './db.types.ts';
import type { MaxValueQueryDescriptor } from './query-builder/query-builder.types.ts';

import { buildMaxValueQuery } from './query-builder/build-max-value-query.util.ts';
import { runQuery } from './run-query.util.ts';

export const getMaxValue = async ({
  tx,
  ...descriptor
}: ExecutorOptions & MaxValueQueryDescriptor): Promise<number> => {
  const { text, values } = buildMaxValueQuery(descriptor);
  const result = await runQuery<{ readonly max: number | string }>({
    text,
    tx,
    values,
  });
  const [row] = result.rows;

  return Number(row?.max ?? 0);
};
