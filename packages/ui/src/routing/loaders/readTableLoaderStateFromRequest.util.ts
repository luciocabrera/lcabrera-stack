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
  /**
   * The route's curated grouping, applied only when the URL carried no
   * `grouping` param — see `resolveLoaderGrouping` for why that distinction is
   * the whole feature.
   */
  readonly defaultGrouping?: TableGroupingState;
  readonly includeFilters?: boolean;
  /**
   * Off leaves `grouping` empty whatever the URL says — the capability is the route's to
   * declare, and a `grouping` param on a route that cannot group is a request for a shape
   * its endpoint does not produce (ADR-063).
   */
  readonly includeGrouping?: boolean;
  /** On, no persisted column layout is read at all (ADR-094). */
  readonly isColumnLayoutTransient?: boolean;
  /**
   * Set when this table shares another route's URL: every param below is read
   * under `TABLE_NESTED_URL_STATE_PREFIX`, matching what the write side puts
   * there.
   */
  readonly isUrlStateNested?: boolean;
  readonly persistenceKey: string;
  readonly request: Request;
};

/**
 * `sorting`, `filters` and `grouping` come from the URL because the persist-cookie flow
 * writes them there (ADR-010, ADR-061).
 */
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

  // Sanitized there rather than here, because an unsanitized key list has no
  // safe consumer: it reaches SQL as an identifier. A route with no declared
  // columns therefore gets no grouping at all, which is the opposite of the
  // filters branch above — filters are values, keys are identifiers.
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
    // The raw params, not a duplicate of the parsed state above. Each carries a
    // distinction the parsed value cannot: `null` is "the URL had no such
    // param", where a string is "a param that happened to deserialize to
    // nothing" — `sorting: []` and `filters: {}` look identical either way.
    // `standaloneFiltersParam` and `standaloneGroupingParam` each have a third
    // state, `undefined`, meaning this route opted out of that param entirely
    // (`includeFilters` / `includeGrouping` off), which is not the same as a
    // route that allows it and received none.
    standaloneFiltersParam,
    standaloneGroupingParam,
    standaloneSortParam,
    totalsPlacement,
  };
};
