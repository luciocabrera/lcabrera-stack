import type { ColumnSort } from '@lcabrera/server/sort/sort.types';
import type { SortingState } from '@lcabrera/ui/components/Table';

import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { resolveQuerySort } from '@lcabrera/server/sort/resolve-query-sort.util';
import { sanitizeSorting } from '@lcabrera/ui/routing/shared/sanitizeSorting.util';

import type { CarSale } from '@/services';

import { fetchCarSalesPage } from '@/services';
import { fakeDelay } from '@/services/fakeDelay.util';
import { isExternalApiEnabled } from '@/services/isExternalApiEnabled.util';

import type { CarSaleRow } from '../config';

import {
  CAR_SALES_ALLOWED_COLUMNS,
  CAR_SALES_COLUMNS,
  CAR_SALES_FALLBACK_SORT,
  CAR_SALES_PRIMARY_KEY,
  CAR_SALES_SCHEMA,
  CAR_SALES_TABLE,
  MAX_CAR_SALES_SORT_RULES,
  toCarSaleRow,
} from '../config';

/**
 * Server-only Postgres data access for `car_sales`, built entirely on the
 * generic `@lcabrera/server` executors (no entity-specific SQL). It reaches the
 * pool via `getPool`, so it must never enter the client bundle.
 *
 * This file lives in a `.server/` directory (a React Router framework
 * convention): every module inside is stripped from the client graph, and the
 * build FAILS if client code imports it. Import it only from loaders, actions
 * and middleware. `routes/enterprise-orders/.server/` is the blueprint.
 */

const TARGET = {
  allowedColumns: CAR_SALES_ALLOWED_COLUMNS,
  schema: CAR_SALES_SCHEMA,
  table: CAR_SALES_TABLE,
} as const;

export type SelectCarSalesPageArgs = {
  readonly limit: number;
  readonly offset: number;
  /**
   * The sort the caller asked for, already reduced to `{ columnKey, direction }`
   * pairs. Resolved against `CAR_SALES_FALLBACK_SORT` here rather than by each
   * caller, so the SSR loader and the paginated resource route cannot order a
   * page two different ways.
   */
  readonly sorting: readonly ColumnSort[];
};

/**
 * Read a page of car sales, plus the row count for the same page's `hasMore`.
 *
 * The count runs on **every** page, which is what the JSON endpoint this
 * replaces did: its response always carried a `total`, and both routes' tables
 * read one from every page. (`enterprise-orders` counts on the first page of a
 * scroll session only — that route's endpoint omits `total` afterwards, and its
 * client is built for that. This one is not, so the cheaper read would change
 * the response shape.) The page and the count are independent queries, so they
 * run concurrently rather than end to end.
 *
 * There is no filter argument: this endpoint never filtered server-side. Both
 * car-sales routes filter in the browser over rows they already hold, and
 * neither declares `isServerFilterEnabled`, so no `filter` param ever arrives.
 *
 * The sort is bounded at `MAX_CAR_SALES_SORT_RULES` before it reaches the
 * builder — the counterpart of what the wide-alltypes service does, and for the
 * same reason: a hand-made request to a public URL could otherwise grow the
 * ORDER BY without limit. The bound is the table's column count, so no sort a
 * user can express reaches it. It lives here rather than in the resource
 * route's parser because the SSR loader does not go through that parser.
 */
export const selectCarSalesPage = async ({
  limit,
  offset,
  sorting,
}: SelectCarSalesPageArgs) => {
  const boundedSorting = sorting.slice(0, MAX_CAR_SALES_SORT_RULES);

  const [rows, total] = await Promise.all([
    selectRows<CarSaleRow>({
      ...TARGET,
      fields: CAR_SALES_COLUMNS,
      limit,
      offset,
      sort: resolveQuerySort({
        fallback: CAR_SALES_FALLBACK_SORT,
        sorting: boundedSorting,
      }),
    }),
    getRowsCount({ ...TARGET, column: CAR_SALES_PRIMARY_KEY }),
  ]);

  const data = rows.map((row) => toCarSaleRow(row));

  return { data, hasMore: offset + data.length < total, total };
};

export type ReadCarSalesPageArgs = {
  readonly limit: number;
  /** The SSR request's URL — only the external branch has an origin to resolve. */
  readonly requestUrl: string;
  readonly skip: number;
  readonly sorting: SortingState<CarSale>;
};

/**
 * A page of car sales from whichever source this deployment is configured for.
 *
 * Self-hosted is the default and reads Postgres in this process: no API server
 * has to be running for `/car-sales` or `/car-sales-infinite` to render (#687).
 * `VITE_API_URL` opts back into the external `car-sales-api`, which answers the
 * identical `{ data, hasMore, total }` — so the branch decides where the rows
 * come from and nothing downstream can tell.
 *
 * Both car-sales routes call this for their first page; the browser's load-more
 * makes the same choice for itself inside `fetchCarSalesPage`.
 *
 * `fakeDelay` is applied only to the self-hosted branch because
 * `fetchCarSalesPage` already carries it — one delay per page either way, which
 * keeps the loading-skeleton demo behaving the same on both paths.
 */
export const readCarSalesPage = async ({
  limit,
  requestUrl,
  skip,
  sorting,
}: ReadCarSalesPageArgs) => {
  if (isExternalApiEnabled()) {
    return fetchCarSalesPage({ limit, requestUrl, skip, sorting });
  }

  await fakeDelay();

  return selectCarSalesPage({
    limit,
    offset: skip,
    sorting: sanitizeSorting<CarSale>(sorting),
  });
};
