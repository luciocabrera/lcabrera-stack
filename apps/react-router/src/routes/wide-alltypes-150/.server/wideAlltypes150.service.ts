import type { RequestedGroupAggregate } from '@lcabrera/server/db/olap/decode-grouped-rows.util';
import type { ColumnSort } from '@lcabrera/server/sort/sort.types';
import type { SortingState } from '@lcabrera/ui/components/Table';
import type {
  TableAggregateFn,
  TableGroupingState,
} from '@lcabrera/ui/components/Table/Table.types';

import { getColumnGroupingCapabilities } from '@lcabrera/server/db/get-column-grouping-capabilities.util';
import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import {
  decodeGroupedRows,
  toGroupAggregates,
  toGroupSort,
} from '@lcabrera/server/db/olap/decode-grouped-rows.util';
import { selectGroupedRows } from '@lcabrera/server/db/select-grouped-rows.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { toSerializableDbError } from '@lcabrera/server/errors/to-serializable-db-error.util';
import { resolveQuerySort } from '@lcabrera/server/sort/resolve-query-sort.util';
import { sanitizeSorting } from '@lcabrera/ui/routing/shared/sanitizeSorting.util';

import type { WideAlltypes150 } from '@/services';

import { fetchWideAlltypes150Page } from '@/services';
import { isExternalApiEnabled } from '@/services/isExternalApiEnabled.util';

import type { WideAlltypes150TableResponse } from '../config';

import {
  MAX_WIDE_ALLTYPES_SORT_RULES,
  toWideAlltypes150Row,
  WIDE_ALLTYPES_ALLOWED_COLUMNS,
  WIDE_ALLTYPES_COLUMNS,
  WIDE_ALLTYPES_FALLBACK_SORT,
  WIDE_ALLTYPES_GROUP_MAX_ROWS,
  WIDE_ALLTYPES_PRIMARY_KEY,
  WIDE_ALLTYPES_SCHEMA,
  WIDE_ALLTYPES_SORTABLE_COLUMNS,
  WIDE_ALLTYPES_TABLE,
} from '../config';

/**
 * Server-only Postgres data access for `wide_alltypes_150`, built entirely on
 * the generic `@lcabrera/server` executors (no entity-specific SQL). It reaches
 * the pool via `getPool`, so it must never enter the client bundle.
 *
 * This file lives in a `.server/` directory (a React Router framework
 * convention): every module inside is stripped from the client graph, and the
 * build FAILS if client code imports it. Import it only from loaders, actions
 * and middleware. `routes/enterprise-orders/.server/` is the blueprint.
 */

const TARGET = {
  allowedColumns: WIDE_ALLTYPES_ALLOWED_COLUMNS,
  schema: WIDE_ALLTYPES_SCHEMA,
  table: WIDE_ALLTYPES_TABLE,
} as const;

const NO_GROUPING: TableGroupingState = {
  aggregates: {},
  keys: [],
  mode: 'flat',
  periods: {},
};

export type SelectGroupedWideAlltypes150Args = {
  /** The aggregate applied to each column, at most one per column. */
  readonly aggregates: Readonly<Record<string, TableAggregateFn>>;
  /** The columns the rows are grouped by, in nesting order. */
  readonly groupKeys: readonly string[];
  readonly groupMode: TableGroupingState['mode'];
  readonly sort: readonly ColumnSort[];
};

/**
 * Read one row per distinct combination of the group keys.
 *
 * **This function is the point of #575.** Every rule a grouped read depends on
 * — the `count(*)`-first aggregate list, the alias pairing, the grouped
 * `ORDER BY`, the `GROUPING()` decode — comes from `@lcabrera/server/db/olap`
 * (ADR-082, #643). What is written here is this table's own: which table, which
 * row ceiling, and turning the UI's aggregate record into a list, which reads a
 * `@lcabrera/ui` type the server package may not depend on (ADR-038).
 *
 * Compare it against `enterpriseOrders.service.ts` and the two are the same
 * eight lines around different constants. That is the genericity claim, and it
 * is checkable by reading rather than asserted.
 *
 * **No error class leaves here**, for the same reason as the orders route:
 * `@lcabrera/server` raises refusals and timeouts as classes, and single fetch
 * strips their prototype without a word, so an `instanceof` on the client is
 * always false (ADR-050, ADR-066).
 */
const selectGroupedWideAlltypes150 = async ({
  aggregates: selectedAggregates,
  groupKeys,
  groupMode,
  sort,
}: SelectGroupedWideAlltypes150Args): Promise<WideAlltypes150TableResponse> => {
  const requested: readonly RequestedGroupAggregate[] = Object.entries(
    selectedAggregates,
  ).map(([column, fn]) => ({ column, fn }));

  try {
    const { aggregates, maskAlias, rows, warning } = await selectGroupedRows({
      ...TARGET,
      aggregates: toGroupAggregates({ requested }),
      grouping: groupMode,
      keys: groupKeys,
      maxRows: WIDE_ALLTYPES_GROUP_MAX_ROWS,
      // `resolveQuerySort` is the same adapter the paginated branch uses, so
      // the two orderings come from one conversion. Its fallback tiebreaker is
      // harmless here: `toGroupSort` keeps only terms naming a group key, and
      // the primary key is never one.
      sort: toGroupSort({
        groupKeys,
        sort: resolveQuerySort({
          fallback: WIDE_ALLTYPES_FALLBACK_SORT,
          sorting: sort,
        }),
      }),
    });

    const data = decodeGroupedRows({
      aggregates,
      columnKeys: groupKeys,
      maskAlias,
      requested,
      rows,
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
 * The wide table is where this matters most: 150 columns of deliberately mixed
 * types, so the coarse `TableColumn.dataType` vocabulary — which reports
 * `numeric`, `jsonb` and `point` alike as `string` (#550) — would offer the
 * wrong aggregates on a large fraction of them.
 */
export const selectWideAlltypes150GroupingCapabilities = async () =>
  getColumnGroupingCapabilities({
    columns: WIDE_ALLTYPES_ALLOWED_COLUMNS,
    schema: WIDE_ALLTYPES_SCHEMA,
    table: WIDE_ALLTYPES_TABLE,
  });

export type SelectWideAlltypes150PageArgs = {
  /** Absent or empty means an ordinary paginated read. */
  readonly grouping?: TableGroupingState;
  readonly limit: number;
  readonly offset: number;
  /**
   * The sort the caller asked for, already reduced to `{ columnKey, direction }`
   * pairs. Narrowing it to what this table can actually order by happens here
   * rather than in each caller, so the SSR loader and the paginated resource
   * route cannot order a page two different ways.
   */
  readonly sorting: readonly ColumnSort[];
};

/**
 * Read a page of wide rows, plus the row count for the same page's `hasMore`.
 *
 * The sort is narrowed before it reaches the builder — unsortable columns
 * dropped, then capped at `MAX_WIDE_ALLTYPES_SORT_RULES` — because
 * `selectRows` validates every term and would otherwise reject the entire read
 * over one column the table happily selects.
 *
 * The count runs on **every** page, which is what the JSON endpoint this
 * replaces did: its response always carried a `total`, and this route's table
 * reads one from every page. The page and the count are independent queries, so
 * they run concurrently rather than end to end.
 */
export const selectWideAlltypes150Page = async ({
  grouping = NO_GROUPING,
  limit,
  offset,
  sorting,
}: SelectWideAlltypes150PageArgs): Promise<WideAlltypes150TableResponse> => {
  if (grouping.keys.length > 0) {
    return selectGroupedWideAlltypes150({
      aggregates: grouping.aggregates,
      groupKeys: grouping.keys,
      groupMode: grouping.mode,
      sort: sorting,
    });
  }

  const sortableSorting = sorting
    .filter(({ columnKey }) => WIDE_ALLTYPES_SORTABLE_COLUMNS.has(columnKey))
    .slice(0, MAX_WIDE_ALLTYPES_SORT_RULES);

  const [rows, total] = await Promise.all([
    selectRows<Record<string, unknown>>({
      ...TARGET,
      fields: WIDE_ALLTYPES_COLUMNS,
      limit,
      offset,
      sort: resolveQuerySort({
        fallback: WIDE_ALLTYPES_FALLBACK_SORT,
        sorting: sortableSorting,
      }),
    }),
    getRowsCount({ ...TARGET, column: WIDE_ALLTYPES_PRIMARY_KEY }),
  ]);

  const data = rows.map((row) => toWideAlltypes150Row(row));

  return { data, hasMore: offset + data.length < total, total };
};

export type ReadWideAlltypes150PageArgs = {
  /** Absent or empty means an ordinary paginated read. */
  readonly grouping?: TableGroupingState;
  readonly limit: number;
  /** The SSR request's URL — only the external branch has an origin to resolve. */
  readonly requestUrl: string;
  readonly skip: number;
  readonly sorting: SortingState<WideAlltypes150>;
};

/**
 * A page of wide rows from whichever source this deployment is configured for.
 *
 * Self-hosted is the default and reads Postgres in this process: no API server
 * has to be running for `/wide-alltypes-150` to render (#687). `VITE_API_URL`
 * opts back into the external endpoint, which answers the identical
 * `{ data, hasMore, total }` — so the branch decides where the rows come from
 * and nothing downstream can tell.
 *
 * The route calls this for its first page; the browser's load-more makes the
 * same choice for itself inside `fetchWideAlltypes150Page`.
 *
 * **`grouping` reaches only the self-hosted branch**, and the loader is what
 * keeps that honest: it declares `isGroupingEnabled` from the same switch, so an
 * external deployment never offers the control and never sends the param. The
 * external endpoint has no grouping API to forward to, and answering a grouped
 * request from this process while the rows came from another one would summarise
 * a different result set than the page it sits above.
 */
export const readWideAlltypes150Page = async ({
  grouping,
  limit,
  requestUrl,
  skip,
  sorting,
}: ReadWideAlltypes150PageArgs): Promise<WideAlltypes150TableResponse> =>
  isExternalApiEnabled()
    ? fetchWideAlltypes150Page({ limit, requestUrl, skip, sorting })
    : selectWideAlltypes150Page({
        grouping,
        limit,
        offset: skip,
        sorting: sanitizeSorting<WideAlltypes150>(sorting),
      });
