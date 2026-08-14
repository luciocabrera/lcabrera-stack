import type { ColumnSort } from '@lcabrera/server/sort/sort.types';
import type { SortingState } from '@lcabrera/ui/components/Table';

import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { resolveQuerySort } from '@lcabrera/server/sort/resolve-query-sort.util';
import { sanitizeSorting } from '@lcabrera/ui/routing/shared/sanitizeSorting.util';

import type { WideAlltypes150 } from '@/services';

import { fetchWideAlltypes150Page } from '@/services';
import { isExternalApiEnabled } from '@/services/isExternalApiEnabled.util';

import {
  MAX_WIDE_ALLTYPES_SORT_RULES,
  toWideAlltypes150Row,
  WIDE_ALLTYPES_ALLOWED_COLUMNS,
  WIDE_ALLTYPES_COLUMNS,
  WIDE_ALLTYPES_FALLBACK_SORT,
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

export type SelectWideAlltypes150PageArgs = {
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
  limit,
  offset,
  sorting,
}: SelectWideAlltypes150PageArgs) => {
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
 */
export const readWideAlltypes150Page = async ({
  limit,
  requestUrl,
  skip,
  sorting,
}: ReadWideAlltypes150PageArgs) =>
  isExternalApiEnabled()
    ? fetchWideAlltypes150Page({ limit, requestUrl, skip, sorting })
    : selectWideAlltypes150Page({
        limit,
        offset: skip,
        sorting: sanitizeSorting<WideAlltypes150>(sorting),
      });
