import type { LoaderFunctionArgs } from 'react-router';

import type { CarSale, CarSalesResponse } from '@/services';

import { INITIAL_PAGE_SIZE } from '@/components/Table/Table.constants';
import { carSalesApi } from '@/services';

import { COLUMNS } from '../car-sales/CarSales.constants';
import { readTableLoaderStateFromRequest } from '../utils/readTableLoaderStateFromRequest.util';
// import type { Route } from './+types/root';
// import {
//   getInitialColumnsState,
//   getInitialMetaState,
// } from '@/components/Table/contexts/TableConfig/utils';
// import { readPersistedStateFromSessionStorage } from '@/components/Table/utils/readPersistedStateFromSessionStorage.util';
// import { readPersistedUiStateFromSessionStorage } from '@/components/Table/utils';
// import { resolveHydratedTableConfigState } from '@/components/Table/contexts/TableConfig/utils';
import {
  PERSISTENCE_KEY,
  SCHEMA_NAME,
  TABLE_NAME,
  TITLE,
} from './CarSales.constants';

/**
 * Loader for car sales infinite route
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
  } = readTableLoaderStateFromRequest<CarSale>({
    columns: COLUMNS,
    includeFilters: true,
    persistenceKey: PERSISTENCE_KEY,
    request,
  });
  const sanitizedSorting = sorting.filter(
    (s): s is { columnKey: keyof CarSale; direction: 'asc' | 'desc' } =>
      s.direction !== undefined && s.columnKey !== 'actions',
  );

  // Return the promise directly (not awaited) for Suspense streaming
  const carSalesPromise: Promise<CarSalesResponse & { hasMore: boolean }> =
    carSalesApi.fetchCarSalesPaginated({
      limit: INITIAL_PAGE_SIZE,
      requestUrl: request.url,
      skip: 0,
      sorting: sanitizedSorting,
    });

  return {
    carSalesPromise,
    columnsState: {
      columnFilters: filters,
      columnOrder,
      columnPinning,
      columns: COLUMNS,
      columnSizing,
      columnVisibility,
      sorting: sanitizedSorting,
    },
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
//   const serverData = await serverLoader();
//   const { columnOrder, columnSizing, columnVisibility, filters, sorting } =
//     serverData;

//   const columnState = readPersistedStateFromSessionStorage<CarSale>({
//     persistenceKey: PERSISTENCE_KEY,
//   });
//   const uiState = readPersistedUiStateFromSessionStorage({
//     persistenceKey: PERSISTENCE_KEY,
//   });

//   const { columnsState, metaState } = resolveHydratedTableConfigState<CarSale>({
//     columnsState: {
//       columnFilters: filters,
//       columnOrder,
//       columns: COLUMNS,
//       columnSizing,
//       columnVisibility,
//       sorting,
//     },
//     metaState: {
//       persistenceKey: PERSISTENCE_KEY,
//       schemaName: SCHEMA_NAME,
//       tableName: TABLE_NAME,
//       title: TITLE,
//     },
//     persistedColumnsState: columnState,
//     persistedMetaState: uiState,
//   });

//   return {
//     columnsState,
//     carSalesPromise: serverData.carSalesPromise,
//     metaState,
//   };
// };

// clientLoader.hydrate = true as const;
