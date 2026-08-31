import type { LoaderFunctionArgs } from 'react-router';

import type {
  ColumnFiltersState,
  SortingState,
  TableColumn,
} from '#ui/components/Table';
import type {
  FilterOptionsTransport,
  TableColumnGroupingCapability,
  TableGroupingState,
  TableLockedFilters,
  TableMetaState,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';

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

type CreateTableRouteLoaderArgs<
  TData extends Record<string, unknown>,
  TResponse,
> = {
  readonly appId: string;
  readonly columns: TableColumn<TData>[];
  readonly defaultGrouping?: TableGroupingState;
  readonly fetchPage: (
    args: TableRouteFetchPageArgs<TData>,
  ) => Promise<TResponse>;
  readonly filterOptions?: { readonly transport: FilterOptionsTransport };
  readonly includeFilters?: boolean;
  readonly meta?: Partial<TableMetaState>;
  readonly persistenceKey: string;
  readonly resolveGroupingCapabilities?: () => Promise<
    Readonly<Record<string, TableColumnGroupingCapability>>
  >;
  readonly resolveLockedFilters?: (args: {
    readonly request: Request;
  }) =>
    | Promise<TableLockedFilters | undefined>
    | TableLockedFilters
    | undefined;
  readonly schemaName?: string;
  readonly tableName: string;
  readonly title: TableMetaState['title'];
};

type TableRouteFetchPageArgs<TData extends Record<string, unknown>> = {
  readonly effectiveSorting: SortingState<TData>;
  readonly filters: ColumnFiltersState<TData>;
  readonly grouping: TableGroupingState;
  readonly request: Request;
  readonly totalsPlacement: TableTotalsPlacement;
};

export const createTableRouteLoader = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  appId,
  columns,
  defaultGrouping,
  fetchPage,
  filterOptions,
  includeFilters = true,
  meta,
  persistenceKey,
  resolveGroupingCapabilities,
  resolveLockedFilters,
  schemaName,
  tableName,
  title,
}: CreateTableRouteLoaderArgs<TData, TResponse>) => {
  const decoratedColumns = filterOptions
    ? appendDistinctFilterDescriptors({
        columns,
        schemaName,
        tableName,
        transport: filterOptions.transport,
      })
    : columns;

  const capabilityMeta = resolveTableCapabilityMeta({ meta });
  const isUrlStateNested = meta?.isUrlStateNested === true;
  const isColumnLayoutTransient = meta?.isColumnLayoutTransient === true;
  const groupDetailsPath = meta?.groupDetailsPath;
  const declaredLockedFilters = meta?.lockedFilters;

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

    const sanitizedSorting = sanitizeSorting<TData>(sorting);
    const effectiveSorting = appendPrimaryKeySorting<TData>({
      columns,
      sorting: sanitizedSorting,
    });

    const dataPromise = fetchPage({
      effectiveSorting,
      filters,
      grouping,
      request,
      totalsPlacement,
    });

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
        columnFilters: filters,
        columnOrder,
        columnPinning,
        columns: decoratedColumns,
        columnSizing,
        columnVisibility,
        sorting: sanitizedSorting,
      },
      dataPromise,
      metaState: {
        ...metaUiFlags,
        appId,
        persistenceKey,
        tableName,
        title,
        ...(schemaName !== undefined && { schemaName }),
        ...meta,
        defaultGroupFold: groupingPreferences.defaultFold,
        groupDetailsPath,
        groupingAggregates: grouping.aggregates,
        groupingCapabilities,
        groupingKeys: grouping.keys,
        groupingMode: grouping.mode,
        groupingPeriods: grouping.periods,
        groupingShares: grouping.shares,
        hasDefaultGrouping:
          defaultGrouping !== undefined && capabilityMeta.isGroupingEnabled,
        isColumnLayoutTransient,
        isUrlStateNested,
        lockedFilters: lockedFilters ?? declaredLockedFilters,
        preferredGroupingMode: groupingPreferences.mode,
        totalsPlacement,
        ...capabilityMeta,
      },
    };
  };
};
