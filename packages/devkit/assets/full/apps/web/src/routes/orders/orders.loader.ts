import { createTableLoaderReads } from '@lcabrera/server/table-page/create-table-loader-reads.util';
import { createTableRouteLoader } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';

import { APP_ID } from '@/constants/app.constants';

import type { OrderRow, OrdersPage } from './orders.types';

import {
  selectGroupingCapabilities,
  selectPage,
} from './.server/orders.reader';
import {
  COLUMNS,
  CRUD,
  DELETE_PATH,
  GROUP_PATH,
  PAGE_LIMIT,
  PERSISTENCE_KEY,
  SCHEMA_NAME,
  TABLE_NAME,
  TITLE,
} from './Orders.constants';

export const loader = createTableRouteLoader<OrderRow, OrdersPage>({
  ...createTableLoaderReads({
    limit: PAGE_LIMIT,
    reader: { selectGroupingCapabilities, selectPage },
  }),
  appId: APP_ID,
  columns: COLUMNS,
  meta: {
    crud: CRUD,
    deleteActionPath: DELETE_PATH,
    groupDetailsPath: GROUP_PATH,
    isGroupingEnabled: true,
    isKeysetEnabled: true,
    isServerFilterEnabled: true,
  },
  persistenceKey: PERSISTENCE_KEY,
  schemaName: SCHEMA_NAME,
  tableName: TABLE_NAME,
  title: TITLE,
});
