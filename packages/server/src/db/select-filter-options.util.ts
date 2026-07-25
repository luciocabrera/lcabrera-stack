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

/**
 * One page of a single column's distinct values, shaped for a filter dropdown:
 * `SELECT DISTINCT <column>` excluding NULL — and the empty string for `text`
 * columns — ordered ascending so pages are stable. This is the dropdown
 * specialization built *on top of* the generic `selectDistinctRows`, not a
 * second query path: it just composes the right `fields`/`filters`/`sort`.
 *
 * `hasMore` follows the page-size convention — a page filled to `limit` implies
 * another may exist. The return is widened to `readonly`; pg hands back mutable
 * arrays and nothing downstream should write to them.
 */
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
