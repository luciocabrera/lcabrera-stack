import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
} from '#ui/components/Table';
import type { TableGroupingState } from '#ui/components/Table/Table.types';
import type { PersistedState } from '#ui/components/Table/utils/persistence.types';

import {
  TABLE_NESTED_URL_STATE_PREFIX,
  TABLE_TOTALS_PLACEMENT_PARAM,
} from '#ui/components/Table/Table.constants';
import {
  readPersistedStateFromCookie,
  readPersistedUiFlagsFromCookie,
} from '#ui/components/Table/utils';
import {
  deserializeFiltersFromURL,
  deserializeSortingFromURL,
} from '#ui/utils/urlState';

import { sanitizeFiltersByColumns } from '../shared/sanitizeFiltersByColumns.util';
import { resolveLoaderGrouping } from './resolveLoaderGrouping.util';
import { resolveLoaderTotalsPlacement } from './resolveLoaderTotalsPlacement.util';

type ReadTableLoaderStateFromRequestArgs<
  TData extends Record<string, unknown>,
> = {
  readonly appId?: string;
  readonly columns?: readonly TableColumn<TData>[];
  readonly defaultGrouping?: TableGroupingState;
  readonly includeFilters?: boolean;
  readonly includeGrouping?: boolean;
  readonly isColumnLayoutTransient?: boolean;
  readonly isUrlStateNested?: boolean;
  readonly persistenceKey: string;
  readonly request: Request;
};

export const readTableLoaderStateFromRequest = <
  TData extends Record<string, unknown>,
>({
  appId,
  columns,
  defaultGrouping,
  includeFilters = false,
  includeGrouping = false,
  isColumnLayoutTransient = false,
  isUrlStateNested = false,
  persistenceKey,
  request,
}: ReadTableLoaderStateFromRequestArgs<TData>) => {
  const url = new URL(request.url);
  const param = (key: string) =>
    url.searchParams.get(
      `${isUrlStateNested ? TABLE_NESTED_URL_STATE_PREFIX : ''}${key}`,
    );

  const cookieHeader = request.headers.get('Cookie');
  const cookieState: Partial<PersistedState> = isColumnLayoutTransient
    ? {}
    : readPersistedStateFromCookie({
        appId,
        cookieString: cookieHeader ?? undefined,
        persistenceKey,
      });

  const metaUiFlags = readPersistedUiFlagsFromCookie({
    appId,
    cookieString: cookieHeader ?? undefined,
    persistenceKey,
  });

  const columnOrder = (cookieState.columnOrder ??
    []) as ColumnOrderState<TData>;

  const columnVisibility = (cookieState.columnVisibility ??
    new Set()) as ColumnVisibilityState<TData>;

  const columnSizing = (cookieState.columnSizing ??
    {}) as ColumnSizingState<TData>;

  const columnPinning =
    cookieState.columnPinning ??
    ({ left: [], right: [] } as ColumnPinningState<TData>);

  const standaloneSortParam = param('sorting');
  const sorting = standaloneSortParam
    ? deserializeSortingFromURL<TData>(standaloneSortParam)
    : ([] as SortingState<TData>);

  const standaloneFiltersParam = includeFilters ? param('filters') : undefined;

  const parsedFilters = standaloneFiltersParam
    ? deserializeFiltersFromURL<TData>(standaloneFiltersParam)
    : ({} as ColumnFiltersState<TData>);

  const filters = columns
    ? sanitizeFiltersByColumns({
        columns,
        filters: parsedFilters,
      })
    : parsedFilters;

  const standaloneGroupingParam = includeGrouping
    ? param('grouping')
    : undefined;

  const grouping = resolveLoaderGrouping({
    columns,
    ...(includeGrouping &&
      defaultGrouping !== undefined && { defaultGrouping }),
    param: standaloneGroupingParam,
  });

  const totalsPlacement = resolveLoaderTotalsPlacement({
    param: param(TABLE_TOTALS_PLACEMENT_PARAM),
    persisted: metaUiFlags.totalsPlacement,
  });

  return {
    columnOrder,
    columnPinning,
    columnSizing,
    columnVisibility,
    filters,
    grouping,
    metaUiFlags,
    sorting,
    standaloneFiltersParam,
    standaloneGroupingParam,
    standaloneSortParam,
    totalsPlacement,
  };
};
