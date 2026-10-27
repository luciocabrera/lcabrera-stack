import type { LoaderFunctionArgs } from 'react-router';

import type { TableColumn } from '#ui/components/Table';
import type {
  FilterOptionsTransport,
  TableCellPalette,
  TableColumnGroupingCapability,
  TableGroupingState,
  TableLockedFilters,
  TableMetaState,
} from '#ui/components/Table/Table.types';

import { toChromeUiFlags } from '#ui/components/Table/utils/toChromeUiFlags.util';

import type { TableRouteLoaderSourceArgs } from './loaders.types';

import { appendPrimaryKeySorting } from '../shared/appendPrimaryKeySorting.util';
import { sanitizeSorting } from '../shared/sanitizeSorting.util';
import { appendDistinctFilterDescriptors } from './appendDistinctFilterDescriptors.util';
import { readTableLoaderStateFromRequest } from './readTableLoaderStateFromRequest.util';
import { resolveTableCapabilityMeta } from './resolveTableCapabilityMeta.util';
import { resolveTableRouteSource } from './resolveTableRouteSource.util';
import { startInjectedResolver } from './startInjectedResolver.util';

export type { TableRouteSource } from './loaders.types';

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
  const source = resolveTableRouteSource<TData, TResponse>(args);
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
