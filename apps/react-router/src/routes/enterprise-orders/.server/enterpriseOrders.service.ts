import type { GroupAggregate } from '@lcabrera/server/db/group-query-builder/group-query-builder.types';
import type {
  QueryFilter,
  QuerySort,
} from '@lcabrera/server/db/query-builder/query-builder.types';
import type {
  TableAggregateFn,
  TableGroupingState,
} from '@lcabrera/ui/components/Table/Table.types';

import { deleteRows } from '@lcabrera/server/db/delete-rows.util';
import { getColumnGroupingCapabilities } from '@lcabrera/server/db/get-column-grouping-capabilities.util';
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

const NO_GROUPING: TableGroupingState = { aggregates: {}, keys: [] };

export type SelectGroupedOrdersArgs = {
  /** The aggregate applied to each column, at most one per column. */
  readonly aggregates: Readonly<Record<string, TableAggregateFn>>;
  readonly filters: readonly QueryFilter[];
  /** The columns the rows are grouped by, in nesting order. */
  readonly groupKeys: readonly string[];
};

/**
 * Read one row per distinct combination of the group keys, each carrying how
 * many orders it covers and the selected aggregates.
 *
 * The whole result is returned at once and `hasMore` is `false`, because a
 * grouped read is not paginated (ADR-059): there is no stable cursor over a
 * result the server aggregated, and the row count is bounded by the number of
 * distinct key combinations rather than by the table.
 *
 * Every alias comes back from `selectGroupedRows` rather than being spelled
 * here, so the name the SQL projected and the name this decodes by are one
 * string.
 */
export const selectGroupedOrders = async ({
  aggregates: selectedAggregates,
  filters,
  groupKeys,
}: SelectGroupedOrdersArgs): Promise<EnterpriseOrdersResponse> => {
  // `satisfies` rather than an annotation: the narrow type keeps `column`
  // required for the decode below, while the check still proves the literal
  // carries no filter or alias slot.
  const requested: readonly OrderColumnAggregate[] = Object.entries(
    selectedAggregates,
  ).map(([column, fn]) => ({ column, fn }) satisfies UnfilteredOrderAggregate);

  const { aggregates, rows } = await selectGroupedRows({
    ...TARGET,
    aggregates: [{ fn: 'count' }, ...requested],
    filters,
    grouping: 'flat',
    keys: groupKeys,
    maxRows: ENTERPRISE_ORDER_GROUP_MAX_ROWS,
    sort: groupKeys.map((key) => ({ direction: 'asc' as const, key })),
  });

  // `count(*)` is requested first, so the emitted aliases line up with
  // `requested` one place along.
  const countAlias = aggregates[0]?.alias ?? '';
  const decodedAggregates = requested.map((aggregate, index) => ({
    alias: aggregates[index + 1]?.alias ?? '',
    columnKey: aggregate.column,
    fn: aggregate.fn,
  }));

  const data = rows.map((row) =>
    toOrderGroupRow({
      aggregates: decodedAggregates,
      columnKeys: groupKeys,
      countAlias,
      row,
    }),
  );

  return { data, hasMore: false, total: data.length };
};

/**
 * What each of this route's columns may do in a grouped read, from the pg
 * catalogue (ADR-058).
 *
 * The loader ships it to the client so the aggregate menu offers only functions
 * legal for a column's **real** Postgres type — a question the browser cannot
 * answer, because `TableColumn.dataType` reports `numeric`, `jsonb` and `point`
 * alike as `string` (#550).
 *
 * It resolves every allowed column rather than only the grouped ones, since the
 * menu has to be right for a column before it is picked. That is one catalogue
 * round trip per grouping-enabled page load, which the loader runs concurrently
 * with the data query.
 */
export const selectOrderGroupingCapabilities = async () =>
  getColumnGroupingCapabilities({
    columns: ENTERPRISE_ORDER_ALLOWED_COLUMNS,
    schema: ENTERPRISE_ORDERS_SCHEMA,
    table: ENTERPRISE_ORDERS_TABLE,
  });

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
   * The grouping configuration the loader sanitized out of the URL — the
   * ordered keys plus the per-column aggregate map. A non-empty key list
   * switches this read to the grouped one; it is sanitized to the route's own
   * columns and empty unless the route declared `isGroupingEnabled`, so an
   * ungrouped route cannot reach that branch however the URL is edited.
   */
  readonly grouping?: TableGroupingState;
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
 * The shape this route actually builds: a column and a function, both required.
 * `UnfilteredOrderAggregate` leaves `column` optional because `count(*)` takes
 * none, and every aggregate the *user* selects has one.
 */
type OrderColumnAggregate = {
  readonly column: string;
  readonly fn: TableAggregateFn;
};

/**
 * A `GroupAggregate` with the filter and alias slots **removed**, which is what
 * makes the #569 deferral structural rather than a matter of discipline: this
 * is the only shape the grouped read builds, so no code path here can construct
 * a filtered aggregate. The compact `grouping` URL param the configuration
 * arrives through has nowhere to carry one either.
 */
type UnfilteredOrderAggregate = Omit<GroupAggregate, 'alias' | 'filters'>;

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
  grouping = NO_GROUPING,
  includeTotal,
  limit,
  offset,
  sort,
}: SelectOrdersPageArgs): Promise<EnterpriseOrdersResponse> => {
  if (grouping.keys.length > 0) {
    return selectGroupedOrders({
      aggregates: grouping.aggregates,
      filters,
      groupKeys: grouping.keys,
    });
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
