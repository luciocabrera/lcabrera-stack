/**
 * Entity configuration for the `car_sales` table.
 *
 * App-local plain data only — NO SQL and NO `pg` here. Shared by the
 * `car-sales` (in-memory paginated) and `car-sales-infinite` routes, which
 * drive the same table, and consumed server-side by the same-origin
 * `/_api/filter-options` service.
 */

// Type-only (erased at build) — carries no `pg`/SQL runtime into this file.
import type { ColumnType } from '@lcabrera/server/db/query-builder/query-builder.types';

export const CAR_SALES_SCHEMA = 'public';
export const CAR_SALES_TABLE = 'car_sales';

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
