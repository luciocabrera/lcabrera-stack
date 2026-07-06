import type { LoaderFunctionArgs } from 'react-router';

import { readTableLoaderStateFromRequest } from '@repo/ui/routing/readTableLoaderStateFromRequest.util';
import { sanitizeSorting } from '@repo/ui/routing/sanitizeSorting.util';

import type { CarSale, CarSalesResponse } from '@/services';

import { APP_ID } from '@/constants/app.constants';
import { carSalesApi } from '@/services';

import {
  COLUMNS,
  PERSISTENCE_KEY,
  SCHEMA_NAME,
  TABLE_NAME,
  TITLE,
} from './CarSales.constants';

/**
 * Loader for car sales route
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
    metaUiFlags,
    sorting,
    standaloneFiltersParam,
    standaloneSortParam,
  } = readTableLoaderStateFromRequest<CarSale>({
    appId: APP_ID,
    columns: COLUMNS,
    includeFilters: true,
    persistenceKey: PERSISTENCE_KEY,
    request,
  });
  const sanitizedSorting = sanitizeSorting<CarSale>(sorting);

  // Return the promise directly (not awaited) for Suspense streaming
  const carSalesPromise: Promise<CarSalesResponse> = carSalesApi.fetchCarSales(
    request.url,
  );

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
      ...metaUiFlags,
      appId: APP_ID,
      persistenceKey: PERSISTENCE_KEY,
      schemaName: SCHEMA_NAME,
      tableName: TABLE_NAME,
      title: TITLE,
    },
  };
};
