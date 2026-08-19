import type { GroupAggregate } from '@lcabrera/server/db/group-query-builder/group-query-builder.types';
import type {
  QueryFilter,
  QuerySort,
} from '@lcabrera/server/db/query-builder/query-builder.types';
import type {
  TableAggregateFn,
  TableGroupingState,
  TableGroupPeriod,
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

const NO_GROUPING: TableGroupingState = {
  aggregates: {},
  keys: [],
  mode: 'flat',
  periods: {},
};

export type SelectGroupedOrdersArgs = {
  /** The aggregate applied to each column, at most one per column. */
  readonly aggregates: Readonly<Record<string, TableAggregateFn>>;
  readonly filters: readonly QueryFilter[];
  /** The columns the rows are grouped by, in nesting order. */
  readonly groupKeys: readonly string[];
  /** Which grouping sets to emit — one, or one per prefix plus the total. */
  readonly groupMode: TableGroupingState['mode'];
  /** The granularity each temporal key is grouped at, by column (#786). */
  readonly groupPeriods: TableGroupingState['periods'];
  /**
   * The table's applied sort. Only the entries naming a **group key** are
   * carried into the grouped read; a sort on any other column has nothing to
   * order, because a grouped result has one row per group and no row of that
   * column's values.
   */
  readonly sort: readonly QuerySort[];
};

/**
 * Read one row per distinct combination of the group keys, each carrying how
 * many orders it covers and the selected aggregates.
 *
 * What is left here is the route's own: which table, which aggregates the UI
 * offered, and the row ceiling it will serve. Building the aggregate list,
 * deriving the grouped ORDER BY and decoding the result are a table feature and
 * live in `@lcabrera/server/db/olap` (ADR-082).
 *
 * The whole result is returned at once and `hasMore` is `false`, because a
 * grouped read is not paginated (ADR-059): there is no stable cursor over a
 * result the server aggregated, and the row count is bounded by the number of
 * distinct key combinations rather than by the table.
 *
 * Every alias comes back from `selectGroupedRows` rather than being spelled
 * here, so the name the SQL projected and the name this decodes by are one
 * string.
 *
 * **This is the loader edge, so no error class leaves it.** A grouped read is
 * the one call here with guard rails that refuse it and a statement timeout
 * that cuts it off, and `@lcabrera/server` raises both as classes — which React
 * Router single fetch strips of their prototype without a word, so an
 * `instanceof` on the client is always false. Every refusal is mapped to the
 * plain `SerializableDbError` union instead (ADR-050, ADR-066). A warning is
 * not an error and rides beside real data.
 */
export const selectGroupedOrders = async ({
  aggregates: selectedAggregates,
  filters,
  groupKeys,
  groupMode,
  groupPeriods,
  sort,
}: SelectGroupedOrdersArgs): Promise<EnterpriseOrdersResponse> => {
  // `satisfies` rather than an annotation: the narrow type keeps `column`
  // required for the decode below, while the check still proves the literal
  // carries no filter or alias slot.
  const requested: readonly OrderColumnAggregate[] = Object.entries(
    selectedAggregates,
  ).map(([column, fn]) => ({ column, fn }) satisfies UnfilteredOrderAggregate);

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
        sort: toGroupSort({ groupKeys, sort }),
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

/**
 * Pairs a drill request's granularities with whether each column carries a time
 * zone — the fact `toDrillRead` needs to compute the right period boundary
 * (#786).
 *
 * The drill route is a second entry point into the same grouping, and it does
 * not go through `selectGroupedRows`, so it has no catalogue answer in hand.
 * The catalogue query is issued only when a granularity is actually present,
 * and only for the columns carrying one — an untruncated drill costs exactly
 * what it cost before.
 */
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
  /**
   * The page window the caller asked for. Clamped into
   * `[1, MAX_ENTERPRISE_ORDERS_LIMIT]` here rather than trusted, because this
   * is the one function both entry points reach — see the ceiling note below.
   */
  readonly limit: number;
  readonly offset: number;
  /**
   * The ORDER BY terms the caller asked for, truncated to
   * `MAX_ENTERPRISE_ORDERS_SORT_RULES` here for the same reason as `limit`.
   */
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
 *
 * **The request-derived window is bounded here, not at the route's parser**
 * (#706). Both entry points size this read — `/_api/enterprise-orders/paginated`
 * from its search params, and the SSR loader from its own constant — and only
 * one of them passes through `parseOrdersPageParams`, so a bound applied there
 * covers half the surface and has to be written twice to cover the rest. This
 * function is the half both halves share, which is what makes one clamp
 * complete: no caller of it, present or future, can widen the window past
 * `MAX_ENTERPRISE_ORDERS_LIMIT` or the ORDER BY past
 * `MAX_ENTERPRISE_ORDERS_SORT_RULES`. `LIMIT 0` is floored to 1 for a different
 * reason: it is a page with no rows and a `hasMore` that says the set is
 * exhausted — a scroll session that silently ends.
 *
 * `offset` is deliberately **not** bounded. One past the end of the table
 * returns an empty page after work bounded by the table rather than by the
 * request, so no value of it makes the response or the read unbounded.
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
  // Before the branch, so the grouped read orders by a bounded sort too, and
  // before the cursor is built, so the tuple is still checked against the sort
  // the query will actually carry.
  const boundedSort = sort.slice(0, MAX_ENTERPRISE_ORDERS_SORT_RULES);

  if (grouping.keys.length > 0) {
    return selectGroupedOrders({
      aggregates: grouping.aggregates,
      filters,
      groupKeys: grouping.keys,
      groupMode: grouping.mode,
      groupPeriods: grouping.periods,
      sort: boundedSort,
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
    // compare against, a page shorter than asked for is the end of the set —
    // measured against the window the query ran with, never the one the caller
    // asked for, or a clamped request would report the set exhausted.
    hasMore:
      total === undefined
        ? data.length === boundedLimit
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
