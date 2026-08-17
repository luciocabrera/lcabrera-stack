export const DEFAULT_PAGE_LIMIT = 50;
export const DISTINCT_DEFAULT_LIMIT = 100;

/**
 * The largest page a read of each table will serve. Without one, `?limit=` is a
 * whole-table read and a whole-table JSON response on a public URL.
 *
 * The row-table ceilings match the showcase's own `MAX_ENTERPRISE_ORDERS_LIMIT`
 * / `MAX_CAR_SALES_LIMIT` / `MAX_WIDE_ALLTYPES_LIMIT`, because these servers
 * serve the same tables — a demo that answers differently from the app it is
 * compared against measures the difference rather than the servers. They are
 * written out rather than imported: the showcase's copies are that app's
 * decision, and a cross-repo import would not survive #690's extraction.
 *
 * The wide table's is lower than the rest because its rows are ~150 columns
 * wide, so an equal row count is a far larger response.
 */
export const MAX_CAR_SALES_LIMIT = 1000;
export const MAX_DISTINCT_LIMIT = 1000;
export const MAX_ENTERPRISE_ORDERS_LIMIT = 1000;
export const MAX_WIDE_ALLTYPES_LIMIT = 200;

export const SANITY_TABLES = [
  'car_sales',
  'enterprise_orders',
  'wide_alltypes_150',
] as const;
