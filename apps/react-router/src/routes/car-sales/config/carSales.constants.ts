/**
 * Entity configuration for the `car_sales` table.
 *
 * App-local plain data only — NO SQL and NO `pg` here. Shared by the
 * `car-sales` (in-memory paginated) and `car-sales-infinite` routes, which
 * drive the same table, and consumed server-side by the same-origin
 * `/_api/filter-options` and `/_api/car-sales/paginated` services.
 *
 * The column list is copied (not imported) from the api layer on purpose —
 * `apps/shared`/`api-shared` must never become a runtime dependency of this
 * app ([ADR-039](../../../../../../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md)),
 * and this app is meant to keep rendering after that package is no longer
 * reachable at all (#686).
 */

// Type-only (erased at build) — carries no `pg`/SQL runtime into this file.
import type { ColumnType } from '@lcabrera/server/db/query-builder/query-builder.types';
import type { ColumnSort } from '@lcabrera/server/sort/sort.types';

export const CAR_SALES_SCHEMA = 'public';
export const CAR_SALES_TABLE = 'car_sales';

/**
 * The primary key — and so the column that makes any order over this table a
 * total order (ADR-008).
 */
export const CAR_SALES_PRIMARY_KEY = 'car_id';

/** Every column of `car_sales`, in alphabetical order. */
export const CAR_SALES_COLUMNS = [
  'buyer_address',
  'buyer_email',
  'buyer_name',
  'buyer_phone',
  'car_id',
  'city',
  'color',
  'country',
  'date_of_ingress',
  'date_of_sale',
  'engine',
  'fuel_type',
  'insurance_expiration_date',
  'insurance_policy_number',
  'insurance_provider',
  'loan_amount',
  'loan_provider',
  'mileage',
  'model',
  'postal_code',
  'profit',
  'purchase_price',
  'sale_price',
  'seller_address',
  'seller_email',
  'seller_name',
  'seller_phone',
  'state',
  'transmission',
  'year',
] as const;

/**
 * Allow-list guarding every request-derived column that reaches a generic query
 * builder (sort and projection). Passed as `allowedColumns`, so a column never
 * listed here is rejected before it can reach SQL. Every column of this table
 * is both projectable and sortable, so the two lists are one list.
 */
export const CAR_SALES_ALLOWED_COLUMNS: readonly string[] = CAR_SALES_COLUMNS;

/**
 * The ordering a paginated read falls back to when the request carries no sort
 * at all — the primary key ascending, the one column guaranteed unique.
 *
 * The Table client never needs it: `buildTablePageQuery` appends the primary key
 * via `appendPrimaryKeySorting`, so a scrolled page always arrives sorted. It
 * exists because `/_api/car-sales/paginated` is a public URL and that guarantee
 * lives in another package's client-side code — a direct request, or a column
 * config that loses `isPrimaryKey`, would otherwise get a paginated read with no
 * ORDER BY, which repeats and skips rows.
 */
export const CAR_SALES_FALLBACK_SORT = [
  { columnKey: CAR_SALES_PRIMARY_KEY, direction: 'asc' },
] as const satisfies readonly ColumnSort[];

/**
 * The largest page `/_api/car-sales/paginated` will serve — the sibling of
 * `MAX_WIDE_ALLTYPES_LIMIT`.
 *
 * `car_sales` holds 500k rows and that URL is public and unauthenticated, so
 * without a ceiling `?limit=999999999` is a whole-table read and a whole-table
 * JSON response. The endpoint this route replaced had no cap either, so this is
 * a pre-existing exposure being closed rather than a regression being fixed —
 * but it was an exposure on a separate api-server, and it is now on the
 * showcase itself.
 *
 * The value is the largest slice this app ever takes of the table in one
 * request: `CLIENT_PAGINATION_ROW_LIMIT`, which `CarSales.constants.tsx`
 * documents as the measured point where SSR stays healthy (~0.8MB against the
 * ~421MB an unbounded read produced). It is written out rather than imported
 * from there because that constant is a UI pagination decision: lowering it for
 * the in-memory demo should not quietly loosen — or, worse, tighten — what a
 * public endpoint will serve.
 *
 * Nothing legitimate is clamped by it. The only caller of that route is
 * `/car-sales-infinite`'s load-more, which asks for `INITIAL_PAGE_SIZE`; the
 * `/car-sales` route takes its larger slice through the service directly and
 * never passes through the parser.
 */
export const MAX_CAR_SALES_LIMIT = 1000;

/**
 * The most ORDER BY terms one read may carry — the sibling of
 * `MAX_WIDE_ALLTYPES_SORT_RULES`, and bounded by a different fact.
 *
 * Wide-alltypes caps at a number well below its column count, because 150
 * columns of tiebreakers over 1M rows is work no user asked for. Here the bound
 * is the column count itself: past it every further term necessarily repeats a
 * column already in the list, and `ORDER BY car_id, car_id` orders nothing the
 * first term did not. So this cannot truncate a sort a user could express —
 * it only stops a hand-made request from growing the SQL text without limit.
 */
export const MAX_CAR_SALES_SORT_RULES = CAR_SALES_COLUMNS.length;

/**
 * Columns offered as distinct-value filter dropdowns, each mapped to its
 * `ColumnType` (consumed by `@lcabrera/server`'s `selectFilterOptions`, where
 * only `text` columns also exclude the empty string). Keys are the distinct
 * allow-list — a column absent here is rejected before any SQL runs. Every one
 * is a free-text `varchar`, so `text` is correct.
 */
export const CAR_SALES_DISTINCT_FILTER_COLUMNS: Readonly<
  Record<string, ColumnType>
> = {
  buyer_name: 'text',
  city: 'text',
  color: 'text',
  country: 'text',
  fuel_type: 'text',
  model: 'text',
  seller_name: 'text',
  transmission: 'text',
};
