import type {
  QueryFilter,
  QuerySort,
} from '@lcabrera/server/db/query-builder/query-builder.types';

import { deleteRows } from '@lcabrera/server/db/delete-rows.util';
import { getMaxValue } from '@lcabrera/server/db/get-max-value.util';
import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { insertRow } from '@lcabrera/server/db/insert-row.util';
import { selectGroupedRows } from '@lcabrera/server/db/select-grouped-rows.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { updateRows } from '@lcabrera/server/db/update-rows.util';

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
  toOrderGroupRow,
  toOrderKeysetCursor,
} from '../config';

/**
 * Server-only Postgres data access for `enterprise_orders`, built entirely on
 * the generic `@lcabrera/server` executors (no entity-specific SQL). It reaches
 * the pool via `getPool`, so it must never enter the client bundle.
 *
 * This file lives in a `.server/` directory (a React Router framework
 * convention): every module inside is stripped from the client graph, and the
 * build FAILS if client code imports it — so the "loaders/actions only" rule is
 * enforced at build time, not just by comment. Import it only from loaders,
 * actions, and middleware.
 */

const TARGET = {
  allowedColumns: ENTERPRISE_ORDER_ALLOWED_COLUMNS,
  schema: ENTERPRISE_ORDERS_SCHEMA,
  table: ENTERPRISE_ORDERS_TABLE,
} as const;

export type SelectGroupedOrdersArgs = {
  readonly filters: readonly QueryFilter[];
  /** The single column the rows are grouped by. */
  readonly groupKey: string;
};

/**
 * Read one row per distinct value of `groupKey`, each carrying how many orders
 * it aggregates.
 *
 * The whole result is returned at once and `hasMore` is `false`, because a
 * grouped read is not paginated (ADR-059): there is no stable cursor over a
 * result the server aggregated, and the row count is bounded by the number of
 * distinct key values rather than by the table.
 *
 * The count's alias comes back from `selectGroupedRows` rather than being
 * spelled here, so the name the SQL projected and the name this decodes by are
 * one string.
 */
export const selectGroupedOrders = async ({
  filters,
  groupKey,
}: SelectGroupedOrdersArgs): Promise<EnterpriseOrdersResponse> => {
  const { aggregates, rows } = await selectGroupedRows({
    ...TARGET,
    aggregates: [{ fn: 'count' }],
    filters,
    grouping: 'flat',
    keys: [groupKey],
    maxRows: ENTERPRISE_ORDER_GROUP_MAX_ROWS,
    sort: [{ direction: 'asc', key: groupKey }],
  });

  const countAlias = aggregates[0]?.alias ?? '';
  const data = rows.map((row) =>
    toOrderGroupRow({ columnKey: groupKey, countAlias, row }),
  );

  return { data, hasMore: false, total: data.length };
};

export type SelectOrdersPageArgs = {
  /**
   * Keyset cursor: the sort-key tuple of the last row of the previous page, one
   * value per `sort` entry. Present, the page seeks straight to it and `offset`
   * is ignored — the two are alternative ways to say the same thing, and
   * applying both would skip a page's worth of rows past the cursor (ADR-052).
   */
  readonly cursor?: readonly unknown[];
  readonly filters: readonly QueryFilter[];
  /**
   * The group keys the loader sanitized out of the URL. Non-empty switches this
   * read to the grouped one — sanitized to the route's own columns and empty
   * unless the route declared `isGroupingEnabled`, so an ungrouped route cannot
   * reach that branch however the URL is edited.
   */
  readonly grouping?: readonly string[];
  /**
   * Count the filtered set and return the total. Only the first page of a
   * scroll session asks for it: the total cannot change while the session runs,
   * so counting per page is work with a known answer (#402).
   */
  readonly includeTotal: boolean;
  readonly limit: number;
  readonly offset: number;
  readonly sort: readonly QuerySort[];
};

/**
 * Read a page of orders for the list view, and — on the first page of a scroll
 * session — the total row count for the same filters. With a group key applied,
 * read one row per group instead.
 *
 * The grouped branch lives behind the same entry point rather than beside it so
 * the response shape is one shape: `EnterpriseOrdersResponse` either way, which
 * is what keeps the loader's inferred data type identical for grouped and
 * ungrouped routes alike.
 *
 * Three things make the ungrouped read cheaper than the obvious spelling:
 *
 * - The page and the count are **independent queries**, so they run
 *   concurrently rather than end to end (#401). `getRowsCount` takes the data
 *   query's own `filters`/`allowedColumns`, so the two still cannot drift.
 * - The count runs only when `includeTotal` says so (#402).
 * - The projection is the list read model, not every column (#405).
 */
export const selectOrdersPage = async ({
  cursor,
  filters,
  grouping = [],
  includeTotal,
  limit,
  offset,
  sort,
}: SelectOrdersPageArgs): Promise<EnterpriseOrdersResponse> => {
  const [groupKey] = grouping;

  if (groupKey !== undefined) {
    return selectGroupedOrders({ filters, groupKey });
  }

  const keysetCursor = toOrderKeysetCursor({ cursor, sort });

  const [data, total] = await Promise.all([
    selectRows<EnterpriseOrderListRow>({
      ...TARGET,
      fields: ENTERPRISE_ORDER_LIST_COLUMNS,
      filters,
      limit,
      sort,
      // One or the other, never both: `OFFSET` on top of a cursor would skip a
      // further `offset` rows past the row we asked to resume after.
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
    // `offset` is the count of rows the client already holds, which the keyset
    // path sends too — so this reads the same either way. Without a total to
    // compare against, a page shorter than asked for is the end of the set.
    hasMore:
      total === undefined
        ? data.length === limit
        : offset + data.length < total,
    ...(total !== undefined && { total }),
  };
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
