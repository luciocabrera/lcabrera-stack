import type { LoaderFunctionArgs } from 'react-router';

import type {
  ColumnFiltersState,
  SortingState,
  TableColumn,
} from '#ui/components/Table';
import type {
  FilterOptionsTransport,
  TableCellPalette,
  TableColumnGroupingCapability,
  TableGroupingState,
  TableLockedFilters,
  TableMetaState,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';

import { toChromeUiFlags } from '#ui/components/Table/utils/toChromeUiFlags.util';

import { appendPrimaryKeySorting } from '../shared/appendPrimaryKeySorting.util';
import { sanitizeSorting } from '../shared/sanitizeSorting.util';
import { appendDistinctFilterDescriptors } from './appendDistinctFilterDescriptors.util';
import { readTableLoaderStateFromRequest } from './readTableLoaderStateFromRequest.util';
import { resolveTableCapabilityMeta } from './resolveTableCapabilityMeta.util';
import { startInjectedResolver } from './startInjectedResolver.util';

const NO_GROUPING_CAPABILITIES: Readonly<
  Record<string, TableColumnGroupingCapability>
> = {};

export type TableRouteLoaderData<
  TData extends Record<string, unknown>,
  TResponse,
> = Awaited<
  ReturnType<ReturnType<typeof createTableRouteLoader<TData, TResponse>>>
>;

export type TableRouteSource<
  TData extends Record<string, unknown>,
  TResponse,
> = {
  /** Request-shaping capabilities the source serves; the route's `meta` overrides each one. */
  readonly capabilities?: Partial<
    Pick<
      TableMetaState,
      'isGroupingEnabled' | 'isKeysetEnabled' | 'isServerFilterEnabled'
    >
  >;
  readonly fetchPage: (
    args: TableRouteFetchPageArgs<TData>,
  ) => Promise<TResponse>;
  /** Endpoint the grid asks for every page after the first. */
  readonly pagePath?: string;
  readonly resolveGroupingCapabilities?: () => Promise<
    Readonly<Record<string, TableColumnGroupingCapability>>
  >;
  readonly schemaName?: string;
  readonly tableName: string;
};

type CreateTableRouteLoaderArgs<
  TData extends Record<string, unknown>,
  TResponse,
> = TableRouteLoaderSourceArgs<TData, TResponse> & {
  readonly appId: string;
  readonly cellPalette?: TableCellPalette;
  readonly columns: TableColumn<TData>[];
  readonly defaultGrouping?: TableGroupingState;
  readonly filterOptions?: { readonly transport: FilterOptionsTransport };
  readonly includeFilters?: boolean;
  readonly meta?: Partial<TableMetaState>;
  readonly persistenceKey: string;
  readonly resolveLockedFilters?: (args: {
    readonly request: Request;
  }) =>
    | Promise<TableLockedFilters | undefined>
    | TableLockedFilters
    | undefined;
  readonly title: TableMetaState['title'];
};

type TableRouteFetchPageArgs<TData extends Record<string, unknown>> = {
  readonly effectiveSorting: SortingState<TData>;
  readonly filters: ColumnFiltersState<TData>;
  readonly grouping: TableGroupingState;
  readonly request: Request;
  readonly totalsPlacement: TableTotalsPlacement;
};

type TableRouteLoaderSourceArgs<
  TData extends Record<string, unknown>,
  TResponse,
> =
  | (Omit<TableRouteSource<TData, TResponse>, 'capabilities' | 'pagePath'> & {
      readonly source?: never;
    })
  | {
      readonly fetchPage?: never;
      readonly resolveGroupingCapabilities?: never;
      readonly schemaName?: never;
      readonly source: TableRouteSource<TData, TResponse>;
      readonly tableName?: never;
    };

export const createTableRouteLoader = <
  TData extends Record<string, unknown>,
  TResponse,
>(
  args: CreateTableRouteLoaderArgs<TData, TResponse>,
) => {
  const {
    appId,
    cellPalette,
    columns,
    defaultGrouping,
    filterOptions,
    includeFilters = true,
    persistenceKey,
    resolveLockedFilters,
    title,
  } = args;
  const source: TableRouteSource<TData, TResponse> =
    args.source === undefined ? args : args.source;
  const { fetchPage, resolveGroupingCapabilities, schemaName, tableName } =
    source;
  const meta = { ...source.capabilities, ...args.meta };

  const decoratedColumns = filterOptions
    ? appendDistinctFilterDescriptors({
        columns,
        schemaName,
        tableName,
        transport: filterOptions.transport,
      })
    : columns;

  const capabilityMeta = resolveTableCapabilityMeta({ meta });
  const isUrlStateNested = meta.isUrlStateNested === true;
  const isColumnLayoutTransient = meta.isColumnLayoutTransient === true;
  const groupDetailsPath = meta.groupDetailsPath;
  const declaredLockedFilters = meta.lockedFilters;

  return async ({ request }: LoaderFunctionArgs) => {
    const {
      columnOrder,
      columnPinning,
      columnSizing,
      columnVisibility,
      filters,
      grouping,
      groupingPreferences,
      metaUiFlags,
      settingsTabOrder,
      sorting,
      totalsPlacement,
    } = readTableLoaderStateFromRequest<TData>({
      appId,
      columns,
      ...(defaultGrouping !== undefined && { defaultGrouping }),
      includeFilters,
      includeGrouping: capabilityMeta.isGroupingEnabled,
      isColumnLayoutTransient,
      isUrlStateNested,
      persistenceKey,
      request,
    });
    const chromeUiFlags = toChromeUiFlags(metaUiFlags);

    const sanitizedSorting = sanitizeSorting<TData>(sorting);
    const effectiveSorting = appendPrimaryKeySorting<TData>({
      columns,
      sorting: sanitizedSorting,
    });
    const groupingState = {
      ...grouping,
      totalsPlacement,
    };

    const dataPromise = fetchPage({
      effectiveSorting,
      filters,
      grouping: groupingState,
      request,
      totalsPlacement,
    });
    void dataPromise.catch(() => undefined);

    const [groupingCapabilities, lockedFilters] = await Promise.all([
      startInjectedResolver(() =>
        resolveGroupingCapabilities && capabilityMeta.isGroupingEnabled
          ? resolveGroupingCapabilities()
          : NO_GROUPING_CAPABILITIES,
      ),
      startInjectedResolver(() => resolveLockedFilters?.({ request })),
    ]);

    return {
      columnsState: {
        ...(cellPalette !== undefined && { cellPalette }),
        columnFilters: filters,
        columnOrder,
        columnPinning,
        columns: decoratedColumns,
        columnSizing,
        columnVisibility,
        sorting: sanitizedSorting,
      },
      dataPromise,
      groupingState,
      metaState: {
        ...chromeUiFlags,
        appId,
        persistenceKey,
        tableName,
        title,
        ...(schemaName !== undefined && { schemaName }),
        ...(source.pagePath !== undefined && { pagePath: source.pagePath }),
        ...meta,
        defaultGroupFold: groupingPreferences.defaultFold,
        groupDetailsPath,
        groupingCapabilities,
        hasDefaultGrouping:
          defaultGrouping !== undefined && capabilityMeta.isGroupingEnabled,
        isColumnLayoutTransient,
        isUrlStateNested,
        lockedFilters: lockedFilters ?? declaredLockedFilters,
        preferredGroupingMode: groupingPreferences.mode,
        settingsTabOrder,
        ...capabilityMeta,
      },
    };
  };
};
