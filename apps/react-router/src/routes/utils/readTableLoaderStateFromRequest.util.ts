import type {
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  SortingState,
  TableColumn,
} from '@/components/Table';

import { readPersistedStateFromCookie } from '@/components/Table/utils';
import {
  deserializeFiltersFromURL,
  deserializeSortingFromURL,
  readTableStateFromURL,
} from '@/utils/urlState';

import { sanitizeFiltersByColumns } from './sanitizeFiltersByColumns.util';

type ReadTableLoaderStateFromRequestArgs<
  TData extends Record<string, unknown>,
> = {
  readonly columns?: readonly TableColumn<TData>[];
  readonly includeFilters?: boolean;
  readonly persistenceKey: string;
  readonly request: Request;
};

type ReadTableLoaderStateFromRequestResult<TData> = {
  readonly columnOrder: (keyof TData)[];
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columnSizing: ColumnSizingState<TData>;
  readonly columnVisibility: Set<keyof TData>;
  readonly filters: ColumnFiltersState<TData>;
  readonly sorting: SortingState<TData>;
  readonly standaloneFiltersParam: null | string | undefined;
  readonly standaloneSortParam: null | string;
};

/**
 * Read shared table loader state from URL and cookies.
 */
export const readTableLoaderStateFromRequest = <
  TData extends Record<string, unknown>,
>({
  columns,
  includeFilters = false,
  persistenceKey,
  request,
}: ReadTableLoaderStateFromRequestArgs<TData>): ReadTableLoaderStateFromRequestResult<TData> => {
  const url = new URL(request.url);

  const urlState = readTableStateFromURL({
    persistenceKey,
    searchParams: url.searchParams,
  });

  const cookieHeader = request.headers.get('Cookie');
  const cookieState = readPersistedStateFromCookie({
    cookieString: cookieHeader ?? undefined,
    persistenceKey,
  });

  const columnOrder = (urlState?.columnOrder ??
    cookieState.columnOrder ??
    []) as (keyof TData)[];

  const columnVisibility = (urlState?.columnVisibility ??
    cookieState.columnVisibility ??
    new Set()) as Set<keyof TData>;

  const columnSizing = (cookieState.columnSizing ??
    {}) as ColumnSizingState<TData>;

  const columnPinning =
    cookieState.columnPinning ?? ({} as ColumnPinningState<TData>);

  const standaloneSortParam = url.searchParams.get('sorting');
  const sorting = standaloneSortParam
    ? deserializeSortingFromURL<TData>(standaloneSortParam)
    : ([] as SortingState<TData>);

  const standaloneFiltersParam = includeFilters
    ? url.searchParams.get('filters')
    : undefined;

  const parsedFilters = standaloneFiltersParam
    ? deserializeFiltersFromURL<TData>(standaloneFiltersParam)
    : ({} as ColumnFiltersState<TData>);

  const filters = columns
    ? sanitizeFiltersByColumns({
        columns,
        filters: parsedFilters,
      })
    : parsedFilters;

  return {
    columnOrder,
    columnPinning,
    columnSizing,
    columnVisibility,
    filters,
    sorting,
    standaloneFiltersParam,
    standaloneSortParam,
  };
};
