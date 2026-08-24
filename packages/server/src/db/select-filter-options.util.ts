import type { ExecutorOptions } from './db.types.ts';
import type {
  ColumnType,
  QueryFilter,
} from './query-builder/query-builder.types.ts';

import { selectDistinctRows } from './select-distinct-rows.util.ts';

type FilterOptionsPage = {
  readonly hasMore: boolean;
  readonly values: readonly string[];
};

type SelectFilterOptionsArgs = ExecutorOptions & {
  readonly allowedColumns?: readonly string[];
  readonly column: string;
  readonly columnType?: ColumnType;
  readonly limit?: number;
  readonly offset?: number;
  readonly schema: string;
  readonly table: string;
};

export const selectFilterOptions = async ({
  allowedColumns,
  column,
  columnType,
  limit,
  offset,
  schema,
  table,
  tx,
}: SelectFilterOptionsArgs): Promise<FilterOptionsPage> => {
  const emptyStringExclusion: readonly QueryFilter[] =
    columnType === 'text' ? [{ column, operator: 'neq', value: '' }] : [];
  const filters: readonly QueryFilter[] = [
    { column, operator: 'isNotNull' },
    ...emptyStringExclusion,
  ];

  const rows = await selectDistinctRows<Record<string, string>>({
    allowedColumns,
    fields: [column],
    filters,
    limit,
    offset,
    schema,
    sort: [{ column, direction: 'asc' }],
    table,
    tx,
  });
  const values = rows
    .map((row) => row[column])
    .filter((value): value is string => value !== undefined);

  return { hasMore: values.length === limit, values };
};
