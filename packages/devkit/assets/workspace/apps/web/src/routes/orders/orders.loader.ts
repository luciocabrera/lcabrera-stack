import { createTableRouteLoader } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';

import { APP_ID } from '@/constants/app.constants';

import type { Order, OrdersPage } from './orders.types';

import {
  COLUMNS,
  PAGE_LIMIT,
  PERSISTENCE_KEY,
  TABLE_NAME,
  TITLE,
} from './Orders.constants';
import { readOrdersPage } from './readOrdersPage.util';

export const loader = createTableRouteLoader<Order, OrdersPage>({
  appId: APP_ID,
  columns: COLUMNS,
  fetchPage: () => readOrdersPage({ limit: PAGE_LIMIT, skip: 0 }),
  persistenceKey: PERSISTENCE_KEY,
  tableName: TABLE_NAME,
  title: TITLE,
});
