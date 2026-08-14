import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { createTableRouteLoader } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';

import type { CarSale, CarSalesResponse } from '@/services';

import { APP_ID } from '@/constants/app.constants';

import { readCarSalesPage } from '../car-sales/.server/carSales.service';
import { COLUMNS } from '../car-sales/CarSales.constants';
import {
  PERSISTENCE_KEY,
  SCHEMA_NAME,
  TABLE_NAME,
  TITLE,
} from './CarSales.constants';

/**
 * Loader for the infinite-scroll car sales route. Loads the first page only;
 * the component fetches subsequent pages via `onLoadMore`, through
 * `/_api/car-sales/paginated`. The read promise is returned unawaited for
 * Suspense streaming.
 *
 * `readCarSalesPage` reads Postgres **server-side** by default — no api-server
 * round-trip — and goes to the external endpoint only when `VITE_API_URL` asks
 * for it.
 */
export const loader = createTableRouteLoader<
  CarSale,
  CarSalesResponse & { hasMore: boolean }
>({
  appId: APP_ID,
  columns: COLUMNS,
  fetchPage: ({ effectiveSorting, request }) =>
    readCarSalesPage({
      limit: INITIAL_PAGE_SIZE,
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
