import type { LoaderFunctionArgs } from 'react-router';

import { appendDistinctFilterDescriptors } from '@lcabrera/ui/routing/appendDistinctFilterDescriptors.util';
import { appendPrimaryKeySorting } from '@lcabrera/ui/routing/appendPrimaryKeySorting.util';
import { readTableLoaderStateFromRequest } from '@lcabrera/ui/routing/readTableLoaderStateFromRequest.util';
import { sanitizeSorting } from '@lcabrera/ui/routing/sanitizeSorting.util';

import type { CarSale, CarSalesResponse } from '@/services';

import { APP_ID } from '@/constants/app.constants';
import { carSalesApi } from '@/services';

import {
  CLIENT_PAGINATION_ROW_LIMIT,
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
  // Columns are serializable (descriptors, never functions — see
  // .claude/rules/routes-data.md), so the loader can return them directly.
  const columns = appendDistinctFilterDescriptors({
    columns: COLUMNS,
    schemaName: SCHEMA_NAME,
    tableName: TABLE_NAME,
    transport: 'loader',
  });

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

  // Return the promise directly (not awaited) for Suspense streaming.
  // This route paginates in memory, so it takes its whole dataset in one
  // bounded slice — see CLIENT_PAGINATION_ROW_LIMIT for why it is bounded.
  const carSalesPromise: Promise<CarSalesResponse & { hasMore: boolean }> =
    carSalesApi.fetchCarSalesPaginated({
      limit: CLIENT_PAGINATION_ROW_LIMIT,
      requestUrl: request.url,
      skip: 0,
      sorting: appendPrimaryKeySorting<CarSale>({
        columns: COLUMNS,
        sorting: sanitizedSorting,
      }),
    });

  return {
    carSalesPromise,
    columnsState: {
      columnFilters: filters,
      columnOrder,
      columnPinning,
      columns,
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
