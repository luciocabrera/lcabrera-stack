import type {
  ColumnFiltersState,
  ColumnSizingState,
  SortingState,
} from '@/components/Table';

import { readPersistedStateFromCookie } from '@/components/Table/utils';
import {
  deserializeFiltersFromURL,
  deserializeSortingFromURL,
  readTableStateFromURL,
} from '@/utils/urlState';

type ReadTableLoaderStateFromRequestArgs = {
  readonly includeFilters?: boolean;
  readonly persistenceKey: string;
  readonly request: Request;
};

type ReadTableLoaderStateFromRequestResult<TData> = {
  readonly columnOrder: (keyof TData)[];
  readonly columnSizing: ColumnSizingState<TData>;
  readonly columnVisibility: Set<keyof TData>;
  readonly filters: ColumnFiltersState<TData>;
  readonly standaloneFiltersParam: string | null;
  readonly standaloneSortParam: string | null;
  readonly sorting: SortingState<TData>;
};

/**
 * Read shared table loader state from URL and cookies.
 */
export const readTableLoaderStateFromRequest = <
  TData extends Record<string, unknown>,
>({
  includeFilters = false,
  persistenceKey,
  request,
}: ReadTableLoaderStateFromRequestArgs): ReadTableLoaderStateFromRequestResult<TData> => {
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

  const standaloneSortParam = url.searchParams.get('sort');
  const sorting = standaloneSortParam
    ? deserializeSortingFromURL<TData>(standaloneSortParam)
    : ([] as SortingState<TData>);

  const standaloneFiltersParam = includeFilters
    ? url.searchParams.get('filters')
    : null;

  const filters = standaloneFiltersParam
    ? deserializeFiltersFromURL<TData>(standaloneFiltersParam)
    : ({} as ColumnFiltersState<TData>);

  return {
    columnOrder,
    columnSizing,
    columnVisibility,
    filters,
    standaloneFiltersParam,
    standaloneSortParam,
    sorting,
  };
};
