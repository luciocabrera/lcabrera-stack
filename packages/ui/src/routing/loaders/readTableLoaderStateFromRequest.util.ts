import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
} from '@lcabrera/ui/components/Table';

import {
  readPersistedStateFromCookie,
  readPersistedUiFlagsFromCookie,
} from '@lcabrera/ui/components/Table/utils';
import {
  deserializeFiltersFromURL,
  deserializeSortingFromURL,
  readTableStateFromURL,
} from '@lcabrera/ui/utils/urlState';

import { sanitizeFiltersByColumns } from '../shared/sanitizeFiltersByColumns.util';

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
}: ReadTableLoaderStateFromRequestArgs<TData>) => {
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
    []) as ColumnOrderState<TData>;

  const columnVisibility = (urlState?.columnVisibility ??
    cookieState.columnVisibility ??
    new Set()) as ColumnVisibilityState<TData>;

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
    // The raw params, not a duplicate of the parsed state above: they are the
    // only way to tell "no `sorting` param" from "a param that deserialized to
    // an empty sort", which `sorting: []` alone cannot express.
    standaloneFiltersParam,
    standaloneSortParam,
  };
};
