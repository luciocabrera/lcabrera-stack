import type { RequestedGroupAggregate } from '@lcabrera/server/db/olap/decode-grouped-rows.util';
import type { ColumnSort } from '@lcabrera/server/sort/sort.types';
import type { SortingState } from '@lcabrera/ui/components/Table';
import type { TableGroupingState } from '@lcabrera/ui/components/Table/Table.types';

import { getColumnGroupingCapabilities } from '@lcabrera/server/db/get-column-grouping-capabilities.util';
import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import {
  decodeGroupedRows,
  toGroupAggregates,
  toGroupSort,
} from '@lcabrera/server/db/olap/decode-grouped-rows.util';
import { selectGroupedRows } from '@lcabrera/server/db/select-grouped-rows.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { toSerializableDbError } from '@lcabrera/server/errors/to-serializable-db-error.util';
import { resolveQuerySort } from '@lcabrera/server/sort/resolve-query-sort.util';
import { sanitizeSorting } from '@lcabrera/ui/routing/shared/sanitizeSorting.util';

import type { WideAlltypes150 } from '@/services';

import { fetchWideAlltypes150Page } from '@/services';
import { isExternalApiEnabled } from '@/services/isExternalApiEnabled.util';

import type { WideAlltypes150TableResponse } from '../config';

import {
  MAX_WIDE_ALLTYPES_SORT_RULES,
  toWideAlltypes150Row,
  WIDE_ALLTYPES_ALLOWED_COLUMNS,
  WIDE_ALLTYPES_COLUMNS,
  WIDE_ALLTYPES_FALLBACK_SORT,
  WIDE_ALLTYPES_GROUP_MAX_ROWS,
  WIDE_ALLTYPES_PRIMARY_KEY,
  WIDE_ALLTYPES_SCHEMA,
  WIDE_ALLTYPES_SORTABLE_COLUMNS,
  WIDE_ALLTYPES_TABLE,
} from '../config';

const TARGET = {
  allowedColumns: WIDE_ALLTYPES_ALLOWED_COLUMNS,
  schema: WIDE_ALLTYPES_SCHEMA,
  table: WIDE_ALLTYPES_TABLE,
} as const;

const NO_GROUPING: TableGroupingState = {
  aggregates: [],
  keys: [],
  mode: 'flat',
  periods: {},
  shares: [],
};

export type SelectGroupedWideAlltypes150Args = {
  readonly aggregates: TableGroupingState['aggregates'];
  readonly groupKeys: readonly string[];
  readonly groupMode: TableGroupingState['mode'];
  readonly groupPeriods: TableGroupingState['periods'];
  readonly sort: readonly ColumnSort[];
};

const selectGroupedWideAlltypes150 = async ({
  aggregates: selectedAggregates,
  groupKeys,
  groupMode,
  groupPeriods,
  sort,
}: SelectGroupedWideAlltypes150Args): Promise<WideAlltypes150TableResponse> => {
  const requested: readonly RequestedGroupAggregate[] = selectedAggregates.map(
    ({ columnKey, fn }) => ({ column: columnKey, fn }),
  );

  try {
    const { aggregates, maskAlias, rows, truncations, warning } =
      await selectGroupedRows({
        ...TARGET,
        aggregates: toGroupAggregates({ requested }),
        grouping: groupMode,
        keys: groupKeys,
        maxRows: WIDE_ALLTYPES_GROUP_MAX_ROWS,
        periods: groupPeriods,
        sort: toGroupSort({
          groupKeys,
          requested,
          sort: resolveQuerySort({
            fallback: WIDE_ALLTYPES_FALLBACK_SORT,
            sorting: sort,
          }),
        }),
      });

    const data = decodeGroupedRows({
      aggregates,
      columnKeys: groupKeys,
      maskAlias,
      requested,
      rows,
      truncations,
    });

    return {
      data,
      hasMore: false,
      total: data.length,
      ...(warning !== undefined && { groupingWarning: warning }),
    };
  } catch (error) {
    return {
      data: [],
      error: toSerializableDbError(error),
      hasMore: false,
      total: 0,
    };
  }
};

export const selectWideAlltypes150GroupingCapabilities = async () =>
  getColumnGroupingCapabilities({
    columns: WIDE_ALLTYPES_ALLOWED_COLUMNS,
    schema: WIDE_ALLTYPES_SCHEMA,
    table: WIDE_ALLTYPES_TABLE,
  });

export type SelectWideAlltypes150PageArgs = {
  readonly grouping?: TableGroupingState;
  readonly limit: number;
  readonly offset: number;
  readonly sorting: readonly ColumnSort[];
};

export const selectWideAlltypes150Page = async ({
  grouping = NO_GROUPING,
  limit,
  offset,
  sorting,
}: SelectWideAlltypes150PageArgs): Promise<WideAlltypes150TableResponse> => {
  if (grouping.keys.length > 0) {
    return selectGroupedWideAlltypes150({
      aggregates: grouping.aggregates,
      groupKeys: grouping.keys,
      groupMode: grouping.mode,
      groupPeriods: grouping.periods,
      sort: sorting,
    });
  }

  const sortableSorting = sorting
    .filter(({ columnKey }) => WIDE_ALLTYPES_SORTABLE_COLUMNS.has(columnKey))
    .slice(0, MAX_WIDE_ALLTYPES_SORT_RULES);

  const [rows, total] = await Promise.all([
    selectRows<Record<string, unknown>>({
      ...TARGET,
      fields: WIDE_ALLTYPES_COLUMNS,
      limit,
      offset,
      sort: resolveQuerySort({
        fallback: WIDE_ALLTYPES_FALLBACK_SORT,
        sorting: sortableSorting,
      }),
    }),
    getRowsCount({ ...TARGET, column: WIDE_ALLTYPES_PRIMARY_KEY }),
  ]);

  const data = rows.map((row) => toWideAlltypes150Row(row));

  return { data, hasMore: offset + data.length < total, total };
};

export type ReadWideAlltypes150PageArgs = {
  readonly grouping?: TableGroupingState;
  readonly limit: number;
  readonly requestUrl: string;
  readonly skip: number;
  readonly sorting: SortingState<WideAlltypes150>;
};

export const readWideAlltypes150Page = async ({
  grouping,
  limit,
  requestUrl,
  skip,
  sorting,
}: ReadWideAlltypes150PageArgs): Promise<WideAlltypes150TableResponse> =>
  isExternalApiEnabled()
    ? fetchWideAlltypes150Page({ limit, requestUrl, skip, sorting })
    : selectWideAlltypes150Page({
        grouping,
        limit,
        offset: skip,
        sorting: sanitizeSorting<WideAlltypes150>(sorting),
      });
