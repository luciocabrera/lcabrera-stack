import type { GroupAggregate } from '@lcabrera/server/db/group-query-builder/group-query-builder.types';
import type {
  QueryFilter,
  QuerySort,
} from '@lcabrera/server/db/query-builder/query-builder.types';
import type {
  TableAggregateFn,
  TableGroupingState,
  TableGroupPeriod,
  TableTotalsPlacement,
} from '@lcabrera/ui/components/Table/Table.types';

import { deleteRows } from '@lcabrera/server/db/delete-rows.util';
import { getColumnGroupingCapabilities } from '@lcabrera/server/db/get-column-grouping-capabilities.util';
import { getMaxValue } from '@lcabrera/server/db/get-max-value.util';
import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { insertRow } from '@lcabrera/server/db/insert-row.util';
import {
  decodeGroupedRows,
  toGroupAggregates,
  toGroupSort,
} from '@lcabrera/server/db/olap/decode-grouped-rows.util';
import { toGroupKeyTruncations } from '@lcabrera/server/db/olap/to-group-key-truncations.util';
import { selectGroupedRows } from '@lcabrera/server/db/select-grouped-rows.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { updateRows } from '@lcabrera/server/db/update-rows.util';
import { toSerializableDbError } from '@lcabrera/server/errors/to-serializable-db-error.util';

import type {
  EnterpriseOrder,
  EnterpriseOrderListRow,
  EnterpriseOrdersResponse,
} from '../config';

import {
  ENTERPRISE_ORDER_ALLOWED_COLUMNS,
  ENTERPRISE_ORDER_COLUMNS,
  ENTERPRISE_ORDER_GROUP_MAX_ROWS,
  ENTERPRISE_ORDER_LIST_COLUMNS,
  ENTERPRISE_ORDER_PRIMARY_KEY,
  ENTERPRISE_ORDERS_SCHEMA,
  ENTERPRISE_ORDERS_TABLE,
  MAX_ENTERPRISE_ORDERS_LIMIT,
  MAX_ENTERPRISE_ORDERS_SORT_RULES,
  toOrderKeysetCursor,
} from '../config';

const TARGET = {
  allowedColumns: ENTERPRISE_ORDER_ALLOWED_COLUMNS,
  schema: ENTERPRISE_ORDERS_SCHEMA,
  table: ENTERPRISE_ORDERS_TABLE,
} as const;

const NO_GROUPING: TableGroupingState = {
  aggregates: [],
  keys: [],
  mode: 'flat',
  periods: {},
  shares: [],
};

export type SelectGroupedOrdersArgs = {
  readonly aggregates: TableGroupingState['aggregates'];
  readonly filters: readonly QueryFilter[];
  readonly groupKeys: readonly string[];
  readonly groupMode: TableGroupingState['mode'];
  readonly groupPeriods: TableGroupingState['periods'];
  readonly sort: readonly QuerySort[];
  readonly subtotalPlacement: TableTotalsPlacement;
};

const selectGroupedOrders = async ({
  aggregates: selectedAggregates,
  filters,
  groupKeys,
  groupMode,
  groupPeriods,
  sort,
  subtotalPlacement,
}: SelectGroupedOrdersArgs): Promise<EnterpriseOrdersResponse> => {
  const requested: readonly OrderColumnAggregate[] = selectedAggregates.map(
    ({ columnKey, fn }) =>
      ({ column: columnKey, fn }) satisfies UnfilteredOrderAggregate,
  );

  try {
    const { aggregates, maskAlias, rows, truncations, warning } =
      await selectGroupedRows({
        ...TARGET,
        aggregates: toGroupAggregates({ requested }),
        filters,
        grouping: groupMode,
        keys: groupKeys,
        maxRows: ENTERPRISE_ORDER_GROUP_MAX_ROWS,
        periods: groupPeriods,
        sort: toGroupSort({ groupKeys, requested, sort }),
        subtotalPlacement,
      });

    const data = decodeGroupedRows({
      aggregates,
      columnKeys: groupKeys,
      maskAlias,
      requested,
      rows,
      truncations,
    });

    return {
      data,
      hasMore: false,
      total: data.length,
      ...(warning !== undefined && { groupingWarning: warning }),
    };
  } catch (error) {
    return {
      data: [],
      error: toSerializableDbError(error),
      hasMore: false,
      total: 0,
    };
  }
};

export const selectOrderGroupingCapabilities = async () =>
  getColumnGroupingCapabilities({
    columns: ENTERPRISE_ORDER_ALLOWED_COLUMNS,
    schema: ENTERPRISE_ORDERS_SCHEMA,
    table: ENTERPRISE_ORDERS_TABLE,
  });

export const selectOrderGroupKeyTruncations = async (
  periods: Readonly<Record<string, TableGroupPeriod>> | undefined,
) => {
  const columns = Object.keys(periods ?? {});

  if (columns.length === 0) return {};

  return toGroupKeyTruncations({
    capabilities: await getColumnGroupingCapabilities({
      columns,
      schema: ENTERPRISE_ORDERS_SCHEMA,
      table: ENTERPRISE_ORDERS_TABLE,
    }),
    periods,
  });
};

export type SelectOrdersPageArgs = {
  readonly cursor?: readonly unknown[];
  readonly filters: readonly QueryFilter[];
  readonly grouping?: TableGroupingState;
  readonly includeTotal: boolean;
  readonly limit: number;
  readonly offset: number;
  readonly sort: readonly QuerySort[];
  readonly totalsPlacement?: TableTotalsPlacement;
};

type OrderColumnAggregate = {
  readonly column: string;
  readonly fn: TableAggregateFn;
};

type UnfilteredOrderAggregate = Omit<GroupAggregate, 'alias' | 'filters'>;

export const selectOrdersPage = async ({
  cursor,
  filters,
  grouping = NO_GROUPING,
  includeTotal,
  limit,
  offset,
  sort,
  totalsPlacement = 'last',
}: SelectOrdersPageArgs): Promise<EnterpriseOrdersResponse> => {
  const boundedSort = sort.slice(0, MAX_ENTERPRISE_ORDERS_SORT_RULES);

  if (grouping.keys.length > 0) {
    return selectGroupedOrders({
      aggregates: grouping.aggregates,
      filters,
      groupKeys: grouping.keys,
      groupMode: grouping.mode,
      groupPeriods: grouping.periods,
      sort: boundedSort,
      subtotalPlacement: totalsPlacement,
    });
  }

  const boundedLimit = Math.min(
    MAX_ENTERPRISE_ORDERS_LIMIT,
    Math.max(1, limit),
  );
  const keysetCursor = toOrderKeysetCursor({ cursor, sort: boundedSort });

  const [data, total] = await Promise.all([
    selectRows<EnterpriseOrderListRow>({
      ...TARGET,
      fields: ENTERPRISE_ORDER_LIST_COLUMNS,
      filters,
      limit: boundedLimit,
      sort: boundedSort,
      ...(keysetCursor === undefined ? { offset } : { cursor: keysetCursor }),
    }),
    includeTotal
      ? getRowsCount({
          ...TARGET,
          column: ENTERPRISE_ORDER_PRIMARY_KEY,
          filters,
        })
      : undefined,
  ]);

  return {
    data,
    hasMore:
      total === undefined
        ? data.length === boundedLimit
        : offset + data.length < total,
    ...(total !== undefined && { total }),
  };
};

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

export const deleteOrder = async (orderId: number) => {
  await deleteRows({
    ...TARGET,
    filters: [{ column: 'order_id', operator: 'eq', value: orderId }],
  });
};
