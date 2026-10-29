import { createTableRouteLoader } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';

import { APP_ID } from '@/constants/app.constants';

import type {
  EnterpriseOrdersResponse,
  EnterpriseOrderTableRow,
} from './config';

import { ordersSource } from './.server/enterpriseOrders.service';
import { ENTERPRISE_ORDERS_GROUP_PATH } from './config';
import {
  CELL_PALETTE,
  COLUMNS,
  CRUD,
  DELETE_ACTION_PATH,
  PERSISTENCE_KEY,
  TITLE,
} from './EnterpriseOrders.constants';

export const loader = createTableRouteLoader<
  EnterpriseOrderTableRow,
  EnterpriseOrdersResponse
>({
  appId: APP_ID,
  cellPalette: CELL_PALETTE,
  columns: COLUMNS,
  filterOptions: { transport: 'loader' },
  meta: {
    crud: CRUD,
    deleteActionPath: DELETE_ACTION_PATH,
    groupDetailsPath: ENTERPRISE_ORDERS_GROUP_PATH,
  },
  persistenceKey: PERSISTENCE_KEY,
  source: ordersSource,
  title: TITLE,
});
