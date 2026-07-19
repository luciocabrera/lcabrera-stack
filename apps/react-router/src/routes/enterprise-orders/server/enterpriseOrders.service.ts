import type {
  QueryFilter,
  QuerySort,
} from '@repo/data-access/db/queryBuilder/QueryBuilder.types';

import { deleteRows } from '@repo/data-access/db/deleteRows.util';
import { getMaxValue } from '@repo/data-access/db/getMaxValue.util';
import { getPool } from '@repo/data-access/db/getPool.util';
import { insertRow } from '@repo/data-access/db/insertRow.util';
import { buildSelectQuery } from '@repo/data-access/db/queryBuilder/buildSelectQuery.util';
import { selectRows } from '@repo/data-access/db/selectRows.util';
import { updateRows } from '@repo/data-access/db/updateRows.util';

import type { EnterpriseOrder, EnterpriseOrdersResponse } from '../config';

import {
  ENTERPRISE_ORDER_ALLOWED_COLUMNS,
  ENTERPRISE_ORDER_COLUMNS,
  ENTERPRISE_ORDERS_SCHEMA,
  ENTERPRISE_ORDERS_TABLE,
  toCountSubquery,
} from '../config';

/**
 * Server-only Postgres data access for `enterprise_orders`, built entirely on
 * the generic `@repo/data-access` executors (no entity-specific SQL). Import
 * ONLY from loaders/actions — it reaches the pool via `getPool` and must never
 * enter the client bundle.
 */

const TARGET = {
  allowedColumns: ENTERPRISE_ORDER_ALLOWED_COLUMNS,
  schema: ENTERPRISE_ORDERS_SCHEMA,
  table: ENTERPRISE_ORDERS_TABLE,
} as const;

export type SelectOrdersPageArgs = {
  readonly filters: readonly QueryFilter[];
  readonly limit: number;
  readonly offset: number;
  readonly sort: readonly QuerySort[];
};

/**
 * Read a page of orders plus the total row count for the same filters. The
 * count reuses the data query's WHERE clause via `toCountSubquery` (the generic
 * `buildCountQuery` cannot count this table — see that util).
 */
export const selectOrdersPage = async ({
  filters,
  limit,
  offset,
  sort,
}: SelectOrdersPageArgs): Promise<EnterpriseOrdersResponse> => {
  const data = await selectRows<EnterpriseOrder>({
    ...TARGET,
    fields: ENTERPRISE_ORDER_COLUMNS,
    filters,
    limit,
    offset,
    sort,
  });

  const countQuery = toCountSubquery(
    buildSelectQuery({ ...TARGET, fields: ['order_id'], filters }),
  );
  const countResult = await getPool().query<{ readonly count: number }>(
    countQuery.text,
    [...countQuery.values],
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  return { data, hasMore: offset + data.length < total, total };
};

/** Read a single order by primary key, or `undefined` when it does not exist. */
export const selectOrderById = async (orderId: number) => {
  const rows = await selectRows<EnterpriseOrder>({
    ...TARGET,
    fields: ENTERPRISE_ORDER_COLUMNS,
    filters: [{ column: 'order_id', operator: 'eq', value: orderId }],
    limit: 1,
  });

  return rows[0];
};

/** The next `order_id` to assign (max + 1); `1` for an empty table. */
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

/** Insert a fully-formed order row and return the persisted record. */
export const insertOrder = async ({ values }: InsertOrderArgs) => {
  const rows = await insertRow<EnterpriseOrder>({ ...TARGET, values });

  return rows[0];
};

export type UpdateOrderArgs = {
  readonly orderId: number;
  readonly values: Readonly<Record<string, unknown>>;
};

/** Update an order by primary key and return the updated record (if any). */
export const updateOrder = async ({ orderId, values }: UpdateOrderArgs) => {
  const rows = await updateRows<EnterpriseOrder>({
    ...TARGET,
    filters: [{ column: 'order_id', operator: 'eq', value: orderId }],
    values,
  });

  return rows[0];
};

/** Delete an order by primary key. */
export const deleteOrder = async (orderId: number) => {
  await deleteRows({
    ...TARGET,
    filters: [{ column: 'order_id', operator: 'eq', value: orderId }],
  });
};
