import { createTableRouteLoader } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';

import type { CarSale, CarSalesResponse } from '@/services';

import { APP_ID } from '@/constants/app.constants';

import { readCarSalesPage } from './.server/carSales.service';
import {
  CLIENT_PAGINATION_ROW_LIMIT,
  COLUMNS,
  PERSISTENCE_KEY,
  SCHEMA_NAME,
  TABLE_NAME,
  TITLE,
} from './CarSales.constants';

export const loader = createTableRouteLoader<
  CarSale,
  CarSalesResponse & { hasMore: boolean }
>({
  appId: APP_ID,
  columns: COLUMNS,
  fetchPage: ({ effectiveSorting, request }) =>
    readCarSalesPage({
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
