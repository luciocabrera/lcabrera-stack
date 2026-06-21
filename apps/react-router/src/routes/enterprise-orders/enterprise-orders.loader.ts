import type { LoaderFunctionArgs } from 'react-router';

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumnsState,
} from '@/components/Table/Table.types';
import type { EnterpriseOrder, EnterpriseOrdersResponse } from '@/services';

import { INITIAL_PAGE_SIZE } from '@/components/Table/Table.constants';
import {
  deriveColumnViewState,
  getStaticColumnKeys,
  readPersistedUiStateFromSessionStorage,
} from '@/components/Table/utils';
import { readPersistedStateFromSessionStorage } from '@/components/Table/utils/readPersistedStateFromSessionStorage.util';
import { enterpriseOrdersApi } from '@/services';

import type { Route } from './+types/root';

import { readTableLoaderStateFromRequest } from '../utils/readTableLoaderStateFromRequest.util';
import {
  COLUMNS,
  DEFAULT_COLUMN_PINNING,
  PERSISTENCE_KEY,
  SCHEMA_NAME,
  TABLE_NAME,
  TITLE,
} from './EnterpriseOrders.constants';

/**
 * Loader for enterprise orders route
 *
 * Returns a promise that can be used with Suspense for streaming.
 * The route will render immediately with the skeleton while data loads.
 */
export const loader = ({ request }: LoaderFunctionArgs) => {
  const {
    columnOrder,
    columnSizing,
    columnVisibility,
    filters,

    sorting,
    standaloneFiltersParam,
    standaloneSortParam,
  } = readTableLoaderStateFromRequest<EnterpriseOrder>({
    columns: COLUMNS,
    includeFilters: true,

    persistenceKey: PERSISTENCE_KEY,
    request,
  });
  const sanitizedSorting = sorting.filter(
    (s): s is { columnKey: keyof EnterpriseOrder; direction: 'asc' | 'desc' } =>
      s.direction !== undefined && s.columnKey !== 'actions',
  );

  // Return the promise directly (not awaited) for Suspense streaming
  const enterpriseOrdersPromise: Promise<EnterpriseOrdersResponse> =
    enterpriseOrdersApi.fetchEnterpriseOrdersPaginated({
      filter: filters,
      limit: INITIAL_PAGE_SIZE,
      requestUrl: request.url,
      skip: 0,
      sorting: sanitizedSorting,
    });

  return {
    columnOrder,
    columns: COLUMNS,

    columnSizing,
    columnVisibility,
    defaultColumnPinning: DEFAULT_COLUMN_PINNING,
    enterpriseOrdersPromise,
    filters,
    key: `${standaloneSortParam ?? ''}${standaloneFiltersParam ?? ''}`,
    persistenceKey: PERSISTENCE_KEY,
    schemaName: SCHEMA_NAME,
    sorting: sanitizedSorting,
    tableName: TABLE_NAME,
    title: TITLE,
  };
};

export const clientLoader = async ({
  serverLoader,
}: Route.ClientLoaderArgs) => {
  const serverData = await serverLoader();
  const {
    columnOrder,
    columns,
    columnSizing,
    columnVisibility,
    defaultColumnPinning,
    filters,
    persistenceKey,
    sorting,
  } = serverData;

  const columnState = readPersistedStateFromSessionStorage<EnterpriseOrder>({
    persistenceKey,
  });
  const uiState = readPersistedUiStateFromSessionStorage({ persistenceKey });
  // const { columnVisibility, ...rest } = columnState;

  const nextColumnFilters = (columnState.columnFilters ??
    filters ??
    ({} as ColumnFiltersState<EnterpriseOrder>)) as ColumnFiltersState<EnterpriseOrder>;
  const nextColumnOrder = (columnState.columnOrder ??
    columnOrder ??
    ([] as ColumnOrderState<EnterpriseOrder>)) as ColumnOrderState<EnterpriseOrder>;
  const nextColumnPinning = (columnState.columnPinning ??
    defaultColumnPinning ??
    ({
      left: [],
      right: [],
    } as ColumnPinningState<EnterpriseOrder>)) as ColumnPinningState<EnterpriseOrder>;
  const nextColumnSizing = (columnState.columnSizing ??
    columnSizing ??
    ({} as ColumnSizingState<EnterpriseOrder>)) as ColumnSizingState<EnterpriseOrder>;
  const nextColumnVisibility = (columnState.columnVisibility ??
    columnVisibility ??
    (new Set() as ColumnVisibilityState<EnterpriseOrder>)) as ColumnVisibilityState<EnterpriseOrder>;
  const nextSorting = (columnState.sorting ??
    sorting ??
    ([] as SortingState<EnterpriseOrder>)) as SortingState<EnterpriseOrder>;

  const {
    columnGroups,
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
  } = deriveColumnViewState<EnterpriseOrder>({
    columnOrder: nextColumnOrder,
    columnPinning: nextColumnPinning,
    columns,
    columnSizing: nextColumnSizing,
    columnVisibility: nextColumnVisibility,
    sorting: nextSorting,
  });

  const nextColumnsState = {
    columnFilters: nextColumnFilters,
    columnGroups,
    columnOrder: nextColumnOrder,
    columnPinning: nextColumnPinning,
    columns,
    columnSizing: nextColumnSizing,
    columnVisibility: nextColumnVisibility,
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
    sorting: nextSorting,
    staticKeys: getStaticColumnKeys(columns),
  } as Partial<TableColumnsState<EnterpriseOrder>>;

  console.log('Client loader - read persisted state from sessionStorage', {
    columnState,
    serverData,
    uiState,
  });

  return { ...serverData, ...nextColumnsState, uiState };
};

// force the client loader to run during hydration
clientLoader.hydrate = true as const; // `as const` for type inference
