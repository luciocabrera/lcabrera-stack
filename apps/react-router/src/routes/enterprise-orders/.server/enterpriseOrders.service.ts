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

/**
 * Server-only Postgres access for `enterprise_orders`. Lives in `.server/`, so
 * the build fails if client code imports it — that is what makes loaders/actions
 * only a build rule here, not a comment. Reaches the pool via `getPool`.
 */

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
  /** Which grouping sets to emit — one, or one per prefix plus the total. */
  readonly groupMode: TableGroupingState['mode'];
  /** The granularity each temporal key is grouped at, by column (#786). */
  readonly groupPeriods: TableGroupingState['periods'];
  readonly sort: readonly QuerySort[];
  /**
   * It only reaches SQL under `rollup` — a flat grouping emits no `GROUPING()` term for it
   * to direct.
   */
  readonly subtotalPlacement: TableTotalsPlacement;
};

/**
 * Building the aggregate list, deriving the grouped ORDER BY and decoding the result are a
 * table feature and live in `@lcabrera/server/db/olap` (ADR-082).
 * The whole result is returned at once and `hasMore` is `false`, because a grouped read is
 * not paginated (ADR-059): there is no stable cursor over a result the server aggregated,
 * and the row count is bounded by the number of distinct key combinations rather than by
 * the table.
 *
 * This is the loader edge, so no error class leaves it. `@lcabrera/server` raises
 * guard-rail refusals and statement timeouts as classes; React Router single
 * fetch strips the prototype, so `instanceof` on the client is always false.
 * Every refusal maps to the plain `SerializableDbError` union (ADR-050, ADR-066).
 */
const selectGroupedOrders = async ({
  aggregates: selectedAggregates,
  filters,
  groupKeys,
  groupMode,
  groupPeriods,
  sort,
  subtotalPlacement,
}: SelectGroupedOrdersArgs): Promise<EnterpriseOrdersResponse> => {
  // `satisfies` rather than an annotation: the narrow type keeps `column`
  // required for the decode below, while the check still proves the literal
  // carries no filter or alias slot.
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

/**
 * What each of this route's columns may do in a grouped read, from the pg catalogue
 * (ADR-058).
 * The loader ships it to the client so the aggregate menu offers only functions legal for
 * a column's **real** Postgres type — a question the browser cannot answer, because
 * `TableColumn.dataType` reports `numeric`, `jsonb` and `point` alike as `string` (#550).
 */
export const selectOrderGroupingCapabilities = async () =>
  getColumnGroupingCapabilities({
    columns: ENTERPRISE_ORDER_ALLOWED_COLUMNS,
    schema: ENTERPRISE_ORDERS_SCHEMA,
    table: ENTERPRISE_ORDERS_TABLE,
  });

/**
 * A request naming a group does not go through `selectGroupedRows`, so it has no catalogue
 * answer in hand.
 * The query is issued only when a granularity is actually present, and only for the
 * columns carrying one — an untruncated read costs exactly what it cost before.
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
   * The grouping configuration the loader sanitized out of the URL — the ordered keys plus
   * the per-column aggregate map.
   * A non-empty key list switches this read to the grouped one; it is sanitized to the
   * route's own columns and empty unless the route declared `isGroupingEnabled`, so an
   * ungrouped route cannot reach that branch however the URL is edited.
   */
  readonly grouping?: TableGroupingState;
  /**
   * Only the first page of a scroll session asks for it: the total cannot change while the
   * session runs, so counting per page is work with a known answer (#402).
   */
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

/**
 * The compact `grouping` URL param the configuration arrives through has nowhere to carry
 * one either.
 */
type UnfilteredOrderAggregate = Omit<GroupAggregate, 'alias' | 'filters'>;

/**
 * `getRowsCount` takes the data query's own `filters`/`allowedColumns`, so the two still
 * cannot drift.
 * `LIMIT 0` is floored to 1 for a different reason: it is a page with no rows and a
 * `hasMore` that says the set is exhausted — a scroll session that silently ends.
 * `offset` is deliberately **not** bounded.
 */
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
