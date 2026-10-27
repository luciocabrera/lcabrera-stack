import type { QueryResultRow } from 'pg';

import type { ExecutorOptions } from './db.types.ts';
import type {
  ColumnReference,
  ForeignKeyRelation,
  QueryFilter,
  ReadJoin,
} from './query-builder/query-builder.types.ts';

import { GroupingRefusedError } from '../errors/grouping-refused.error.ts';
import { assertColumnAxisMaxDistinct } from './group-query-builder/assert-column-axis-max-distinct.util.ts';
import { buildReadQuery } from './query-builder/build-read-query.util.ts';
import { toColumnName } from './query-builder/to-column-name.util.ts';
import { runQuery } from './run-query.util.ts';

type SelectColumnAxisValuesArgs = ExecutorOptions & {
  readonly allowedColumns: readonly string[];
  readonly filters?: readonly QueryFilter<ColumnReference>[];
  readonly joins?: readonly ReadJoin[];
  readonly key: ColumnReference;
  readonly limit?: number;
  readonly maxDistinct: number;
  readonly relations?: readonly ForeignKeyRelation[];
  readonly schema: string;
  readonly table: string;
};

export const selectColumnAxisValues = async ({
  allowedColumns,
  filters,
  joins,
  key,
  limit,
  maxDistinct,
  relations,
  schema,
  table,
  tx,
}: SelectColumnAxisValuesArgs) => {
  assertColumnAxisMaxDistinct(maxDistinct);

  const name = toColumnName(key);

  const built = buildReadQuery({
    allowedColumns,
    distinct: true,
    fields: [key],
    filters,
    joins,
    limit: limit ?? maxDistinct + 1,
    relations,
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
      column: name,
      message: `Column "${name}" has more than ${maxDistinct} distinct values, past the configured column-axis ceiling.`,
      reason: 'column-axis-too-wide',
    });
  }

  return result.rows.map((row) => {
    const value = row[name];

    return value ?? undefined;
  });
};
