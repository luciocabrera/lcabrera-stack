import type { TablePageRead } from '@lcabrera/server/table-page/table-page.types';

import { createTablePageReader } from '@lcabrera/server/table-page/create-table-page-reader.util';
import { ACTIONS_COLUMN_KEY } from '@lcabrera/ui/components/Table/Table.constants';

import type { Order, OrdersPage } from '../orders.types';

import { PAGE_LIMIT, TARGET } from '../Orders.constants';

const reader = createTablePageReader<Order, 'order_id'>({
  defaultLimit: PAGE_LIMIT,
  fallbackSort: [{ columnKey: 'order_id', direction: 'asc' }],
  groupMaxRows: 5000,
  ignoredSortColumns: [ACTIONS_COLUMN_KEY],
  maxLimit: 1000,
  primaryKey: 'order_id',
  target: TARGET,
});

export const {
  deleteRow,
  resolveGroupRead,
  resolveGroupRestriction,
  resolvePageRead,
  selectGroupingCapabilities,
} = reader;

export const selectPage: (read: TablePageRead) => Promise<OrdersPage> =
  reader.selectPage;
