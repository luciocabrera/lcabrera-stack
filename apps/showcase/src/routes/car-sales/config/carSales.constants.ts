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

export const CAR_SALES_ALLOWED_COLUMNS: readonly string[] = CAR_SALES_COLUMNS;

export const CAR_SALES_FALLBACK_SORT = [
  { columnKey: CAR_SALES_PRIMARY_KEY, direction: 'asc' },
] as const satisfies readonly ColumnSort[];

export const MAX_CAR_SALES_LIMIT = 1000;

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
