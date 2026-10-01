import type { TablePageRead } from '@lcabrera/server/table-page/table-page.types';
import type { TableGroupingState } from '@lcabrera/ui/components/Table/Table.types';

import { getMaxValue } from '@lcabrera/server/db/get-max-value.util';
import { insertRow } from '@lcabrera/server/db/insert-row.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { updateRows } from '@lcabrera/server/db/update-rows.util';
import { createTablePageReader } from '@lcabrera/server/table-page/create-table-page-reader.util';
import {
  ACTIONS_COLUMN_KEY,
  INITIAL_PAGE_SIZE,
} from '@lcabrera/ui/components/Table/Table.constants';

import type {
  EnterpriseOrder,
  EnterpriseOrderListRow,
  EnterpriseOrdersResponse,
} from '../config';

import {
  ENTERPRISE_ORDER_ALLOWED_COLUMNS,
  ENTERPRISE_ORDER_COLUMNS,
  ENTERPRISE_ORDER_FALLBACK_SORT,
  ENTERPRISE_ORDER_GROUP_MAX_ROWS,
  ENTERPRISE_ORDER_LIST_COLUMNS,
  ENTERPRISE_ORDER_PRIMARY_KEY,
  ENTERPRISE_ORDERS_SCHEMA,
  ENTERPRISE_ORDERS_TABLE,
  MAX_ENTERPRISE_ORDERS_LIMIT,
  MAX_ENTERPRISE_ORDERS_SORT_RULES,
} from '../config';

const TARGET = {
  allowedColumns: ENTERPRISE_ORDER_ALLOWED_COLUMNS,
  schema: ENTERPRISE_ORDERS_SCHEMA,
  table: ENTERPRISE_ORDERS_TABLE,
} as const;

const ordersPage = createTablePageReader<EnterpriseOrderListRow>({
  defaultLimit: INITIAL_PAGE_SIZE,
  fallbackSort: ENTERPRISE_ORDER_FALLBACK_SORT,
  fields: ENTERPRISE_ORDER_LIST_COLUMNS,
  groupMaxRows: ENTERPRISE_ORDER_GROUP_MAX_ROWS,
  ignoredSortColumns: [ACTIONS_COLUMN_KEY],
  maxLimit: MAX_ENTERPRISE_ORDERS_LIMIT,
  maxSortRules: MAX_ENTERPRISE_ORDERS_SORT_RULES,
  primaryKey: ENTERPRISE_ORDER_PRIMARY_KEY,
  target: TARGET,
});

export const {
  deleteRow: deleteOrder,
  resolveGroupRead: resolveOrdersGroupRead,
  resolveGroupRestriction: resolveOrdersGroupRestriction,
  resolvePageRead: resolveOrdersPageRead,
  selectGroupingCapabilities: selectOrderGroupingCapabilities,
  selectGroupKeyTruncations: selectOrderGroupKeyTruncations,
} = ordersPage;

type SelectOrdersPageArgs = Omit<TablePageRead, 'grouping'> & {
  readonly grouping?: TableGroupingState;
};

export const selectOrdersPage: (
  args: SelectOrdersPageArgs,
) => Promise<EnterpriseOrdersResponse> = ordersPage.selectPage;

export const selectOrderById = async (orderId: number) => {
  const rows = await selectRows<EnterpriseOrder>({
    ...TARGET,
    fields: ENTERPRISE_ORDER_COLUMNS,
    filters: [{ column: 'order_id', operator: 'eq', value: orderId }],
    limit: 1,
  });

  return rows[0];
};

export const getNextOrderId = async () => {
  const max = await getMaxValue({
    ...TARGET,
    column: 'order_id',
  });

  return max + 1;
};

export type InsertOrderArgs = {
  readonly values: Readonly<Record<string, unknown>>;
};

export const insertOrder = async ({ values }: InsertOrderArgs) => {
  const rows = await insertRow<EnterpriseOrder>({ ...TARGET, values });

  return rows[0];
};

export type UpdateOrderArgs = {
  readonly orderId: number;
  readonly values: Readonly<Record<string, unknown>>;
};

export const updateOrder = async ({ orderId, values }: UpdateOrderArgs) => {
  const rows = await updateRows<EnterpriseOrder>({
    ...TARGET,
    filters: [{ column: 'order_id', operator: 'eq', value: orderId }],
    values,
  });

  return rows[0];
};
