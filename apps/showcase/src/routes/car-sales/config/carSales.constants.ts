/**
 * The column list is copied (not imported) from the api layer on purpose — that
 * layer must never become a runtime dependency of this app
 * ([ADR-039](../../../../../../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md)),
 * and this app is meant to keep rendering when it is not reachable at all.
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
 * Passed as `allowedColumns`, so a column never listed here is rejected before it can
 * reach SQL.
 */
export const CAR_SALES_ALLOWED_COLUMNS: readonly string[] = CAR_SALES_COLUMNS;

/**
 * The Table client never needs it: `buildTablePageQuery` appends the primary key via
 * `appendPrimaryKeySorting`, so a scrolled page always arrives sorted.
 * It exists because `/_api/car-sales/paginated` is a public URL and that guarantee lives
 * in another package's client-side code — a direct request, or a column config that loses
 * `isPrimaryKey`, would otherwise get a paginated read with no ORDER BY, which repeats and
 * skips rows.
 */
export const CAR_SALES_FALLBACK_SORT = [
  { columnKey: CAR_SALES_PRIMARY_KEY, direction: 'asc' },
] as const satisfies readonly ColumnSort[];

/**
 * The only caller of that route is `/car-sales-infinite`'s load-more, which asks for
 * `INITIAL_PAGE_SIZE`; the `/car-sales` route takes its larger slice through the service
 * directly and never passes through the parser.
 */
export const MAX_CAR_SALES_LIMIT = 1000;

/**
 * Wide-alltypes caps at a number well below its column count, because 150 columns of
 * tiebreakers over 1M rows is work no user asked for.
 * So this cannot truncate a sort a user could express — it only stops a hand-made request
 * from growing the SQL text without limit.
 */
export const MAX_CAR_SALES_SORT_RULES = CAR_SALES_COLUMNS.length;

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
