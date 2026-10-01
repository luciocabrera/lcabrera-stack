import { createGroupDetailReads } from '@lcabrera/server/table-page/create-group-detail-reads.util';
import { createTableRouteLoader } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';

import { APP_ID } from '@/constants/app.constants';

import type { OrderRow, OrdersPage } from '../orders.types';

import {
  resolveGroupRead,
  resolveGroupRestriction,
  selectPage,
} from '../.server/orders.reader';
import {
  COLUMNS,
  GROUP_PERSISTENCE_KEY,
  PAGE_LIMIT,
  TABLE_NAME,
  TITLE,
} from '../Orders.constants';

export const loader = createTableRouteLoader<OrderRow, OrdersPage>({
  ...createGroupDetailReads({
    columns: COLUMNS,
    limit: PAGE_LIMIT,
    reader: { resolveGroupRead, resolveGroupRestriction, selectPage },
  }),
  appId: APP_ID,
  columns: COLUMNS,
  meta: {
    isColumnLayoutTransient: true,
    isServerFilterEnabled: true,
    isUrlStateNested: true,
  },
  persistenceKey: GROUP_PERSISTENCE_KEY,
  tableName: TABLE_NAME,
  title: TITLE,
});
