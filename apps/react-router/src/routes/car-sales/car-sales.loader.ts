import { createTableRouteLoader } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';

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
 * Loader for the car sales route. This route paginates in memory, so it takes
 * its whole dataset in one bounded slice — see `CLIENT_PAGINATION_ROW_LIMIT`
 * for why it is bounded. The fetch promise is returned unawaited for Suspense
 * streaming.
 */
export const loader = createTableRouteLoader<
  CarSale,
  CarSalesResponse & { hasMore: boolean }
>({
  appId: APP_ID,
  columns: COLUMNS,
  fetchPage: ({ effectiveSorting, request }) =>
    carSalesApi.fetchCarSalesPaginated({
      limit: CLIENT_PAGINATION_ROW_LIMIT,
      requestUrl: request.url,
      skip: 0,
      sorting: effectiveSorting,
    }),
  filterOptions: { transport: 'loader' },
  persistenceKey: PERSISTENCE_KEY,
  schemaName: SCHEMA_NAME,
  tableName: TABLE_NAME,
  title: TITLE,
});
