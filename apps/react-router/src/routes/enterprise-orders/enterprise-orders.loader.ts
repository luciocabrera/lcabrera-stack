import type { LoaderFunctionArgs } from 'react-router';

import type { EnterpriseOrder, EnterpriseOrdersResponse } from '@/services';

import { INITIAL_PAGE_SIZE } from '@/components/Table/Table.constants';
import { enterpriseOrdersApi } from '@/services';

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
    columnPinning,
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

  console.log('EnterpriseOrders loader', {
    sorting: sanitizedSorting,
    standaloneSortParam,
  });

  return {
    columnsState: {
      columnFilters: filters,
      columnOrder,
      columnPinning,
      columns: COLUMNS,
      columnSizing,
      columnVisibility,
      sorting: sanitizedSorting,
    },
    defaultColumnPinning: DEFAULT_COLUMN_PINNING,
    enterpriseOrdersPromise,
    key: `${standaloneSortParam ?? ''}${standaloneFiltersParam ?? ''}`,
    metaState: {
      persistenceKey: PERSISTENCE_KEY,
      schemaName: SCHEMA_NAME,
      tableName: TABLE_NAME,
      title: TITLE,
    },
  };
};

// export const clientLoader = async ({
//   serverLoader,
// }: Route.ClientLoaderArgs) => {
//   const serverData = serverLoader();
//   // const {
//   //   columnOrder,
//   //   columns,
//   //   columnSizing,
//   //   columnVisibility,
//   //   defaultColumnPinning,
//   //   filters,
//   //   persistenceKey,
//   //   sorting,
//   // } = serverData;

//   const columnState = readPersistedStateFromSessionStorage<EnterpriseOrder>({
//     persistenceKey: PERSISTENCE_KEY,
//   });
//   const uiState = readPersistedUiStateFromSessionStorage({
//     persistenceKey: PERSISTENCE_KEY,
//   });

//   console.log('Client loader - starting', {
//     columnState,
//     serverData,
//     uiState,
//   });
//   // const { columnVisibility, ...rest } = columnState;

//   return { columnState, serverData, uiState };

//   // ...rest,
//   // columnVisibility: columnVisibility ?? new Set(),

//   // const nextColumnFilters = (columnState.columnFilters ??
//   //   filters ??
//   //   ({} as ColumnFiltersState<EnterpriseOrder>)) as ColumnFiltersState<EnterpriseOrder>;
//   // const nextColumnOrder = (columnState.columnOrder ??
//   //   columnOrder ??
//   //   ([] as ColumnOrderState<EnterpriseOrder>)) as ColumnOrderState<EnterpriseOrder>;
//   // const nextColumnPinning = (columnState.columnPinning ??
//   //   defaultColumnPinning ??
//   //   ({
//   //     left: [],
//   //     right: [],
//   //   } as ColumnPinningState<EnterpriseOrder>)) as ColumnPinningState<EnterpriseOrder>;
//   // const nextColumnSizing = (columnState.columnSizing ??
//   //   columnSizing ??
//   //   ({} as ColumnSizingState<EnterpriseOrder>)) as ColumnSizingState<EnterpriseOrder>;
//   // const nextColumnVisibility = (columnState.columnVisibility ??
//   //   columnVisibility ??
//   //   (new Set() as ColumnVisibilityState<EnterpriseOrder>)) as ColumnVisibilityState<EnterpriseOrder>;
//   // const nextSorting = (columnState.sorting ??
//   //   sorting ??
//   //   ([] as SortingState<EnterpriseOrder>)) as SortingState<EnterpriseOrder>;

//   // const { columnsState: nextColumnsState, metaState: nextMetaState } =
//   //   resolveHydratedTableConfigState<EnterpriseOrder>({
//   //     columnsState: {
//   //       columnFilters: nextColumnFilters,
//   //       columnOrder: nextColumnOrder,
//   //       columnPinning: nextColumnPinning,
//   //       columns,
//   //       columnSizing: nextColumnSizing,
//   //       columnVisibility: nextColumnVisibility,
//   //       sorting: nextSorting,
//   //     },
//   //     metaState: {
//   //       persistenceKey,
//   //       schemaName: SCHEMA_NAME,
//   //       tableName: TABLE_NAME,
//   //       title: TITLE,
//   //     },
//   //     persistedColumnsState: columnState,
//   //     persistedMetaState: uiState,
//   //   });

//   // console.log('Client loader - read persisted state from sessionStorage', {
//   //   columnState,
//   //   nextColumnsState,
//   //   serverData,
//   //   uiState,
//   // });

//   // console.log('Client loader - resolved next state', {
//   //   columnsState: nextColumnsState,
//   //   defaultColumnPinning,
//   //   enterpriseOrdersPromise: serverData.enterpriseOrdersPromise,
//   //   metaState: {
//   //     ...nextMetaState,
//   //     ...uiState,
//   //   },
//   // });

//   // return {
//   //   columnsState: nextColumnsState,
//   //   defaultColumnPinning,
//   //   enterpriseOrdersPromise: serverData.enterpriseOrdersPromise,
//   //   metaState: {
//   //     ...nextMetaState,
//   //     ...uiState,
//   //   },
//   // };
// };

// // force the client loader to run during hydration
// clientLoader.hydrate = true as const; // `as const` for type inference
