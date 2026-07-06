import type {
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  SortingState,
  TableColumn,
} from '@repo/ui/components/Table';

import {
  readPersistedStateFromCookie,
  readPersistedUiFlagsFromCookie,
} from '@repo/ui/components/Table/utils';
import {
  deserializeFiltersFromURL,
  deserializeSortingFromURL,
  readTableStateFromURL,
} from '@repo/ui/utils/urlState';

import { sanitizeFiltersByColumns } from './sanitizeFiltersByColumns.util';

/**
 * Drawer open/pinned flags read from cookies so the loader can SSR-seed the
 * table's initial meta state and avoid a hydration layout shift.
 */
type LoaderMetaUiFlags = {
  readonly isColumnSettingsOpen?: boolean;
  readonly isColumnSettingsPinned?: boolean;
  readonly isTableSettingsOpen?: boolean;
  readonly isTableSettingsPinned?: boolean;
};

type ReadTableLoaderStateFromRequestArgs<
  TData extends Record<string, unknown>,
> = {
  /**
   * Per-application identifier used to scope persisted cookies so tables in
   * different apps that share a `persistenceKey` do not read each other's state.
   */
  readonly appId?: string;
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
  readonly metaUiFlags: LoaderMetaUiFlags;
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
  appId,
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
    appId,
    cookieString: cookieHeader ?? undefined,
    persistenceKey,
  });

  const metaUiFlags = readPersistedUiFlagsFromCookie({
    appId,
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
    cookieState.columnPinning ??
    ({ left: [], right: [] } as ColumnPinningState<TData>);

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
    metaUiFlags,
    sorting,
    standaloneFiltersParam,
    standaloneSortParam,
  };
};
