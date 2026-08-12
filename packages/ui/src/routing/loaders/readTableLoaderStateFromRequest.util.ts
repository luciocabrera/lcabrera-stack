import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
} from '#ui/components/Table';

import {
  readPersistedStateFromCookie,
  readPersistedUiFlagsFromCookie,
} from '#ui/components/Table/utils';
import {
  deserializeFiltersFromURL,
  deserializeSortingFromURL,
} from '#ui/utils/urlState';

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
 *
 * `sorting` and `filters` come from the URL because the persist-cookie flow
 * writes them there (ADR-010, ADR-061). Order, visibility, sizing and pinning
 * are cookie-only on that same flow, so they are read only from the cookie.
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

  const columnOrder = (cookieState.columnOrder ??
    []) as ColumnOrderState<TData>;

  const columnVisibility = (cookieState.columnVisibility ??
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
    // The raw params, not a duplicate of the parsed state above. Each carries a
    // distinction the parsed value cannot: `null` is "the URL had no such
    // param", where a string is "a param that happened to deserialize to
    // nothing" — `sorting: []` and `filters: {}` look identical either way.
    // `standaloneFiltersParam` has a third state, `undefined`, meaning this
    // route opted out of URL filters entirely (`includeFilters: false`), which
    // is not the same as a route that allows them and received none.
    standaloneFiltersParam,
    standaloneSortParam,
  };
};
