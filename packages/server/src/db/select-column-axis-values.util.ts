import type { QueryResultRow } from 'pg';

import type { ExecutorOptions } from './db.types.ts';
import type { QueryFilter } from './query-builder/query-builder.types.ts';

import { GroupingRefusedError } from '../errors/grouping-refused.error.ts';
import { assertColumnAxisMaxDistinct } from './group-query-builder/assert-column-axis.util.ts';
import { buildSelectQuery } from './query-builder/build-select-query.util.ts';
import { runQuery } from './run-query.util.ts';

type SelectColumnAxisValuesArgs = ExecutorOptions & {
  readonly allowedColumns: readonly string[];
  readonly filters?: readonly QueryFilter[];
  readonly key: string;
  readonly maxDistinct: number;
  readonly schema: string;
  readonly table: string;
};

export const selectColumnAxisValues = async ({
  allowedColumns,
  filters,
  key,
  maxDistinct,
  schema,
  table,
  tx,
}: SelectColumnAxisValuesArgs) => {
  assertColumnAxisMaxDistinct(maxDistinct);

  const built = buildSelectQuery({
    allowedColumns,
    distinct: true,
    fields: [key],
    filters,
    limit: maxDistinct + 1,
    schema,
    sort: [{ column: key, direction: 'asc' }],
    table,
  });
  const result = await runQuery<QueryResultRow>({
    text: built.text,
    tx,
    values: built.values,
  });

  if (result.rows.length > maxDistinct) {
    throw new GroupingRefusedError({
      column: key,
      message: `Column "${key}" has more than ${maxDistinct} distinct values, past the configured column-axis ceiling.`,
      reason: 'column-axis-too-wide',
    });
  }

  return result.rows.map((row) => {
    const value = row[key];

    return value ?? undefined;
  });
};
