import type { BuiltQuery } from '@repo/data-access/db/queryBuilder/QueryBuilder.types';

/**
 * Wrap a filtered SELECT (no limit/offset) as a `count(*)` subquery, reusing
 * the exact WHERE clause + params of the data query so the two can never drift.
 * This is the generic alternative to `buildCountQuery`, which hardcodes
 * `count(id)` and so cannot count `enterprise_orders` (its key is `order_id`).
 */
export const toCountSubquery = (dataQuery: BuiltQuery): BuiltQuery => ({
  text: `SELECT count(*)::int AS count FROM (${dataQuery.text}) AS subquery`,
  values: dataQuery.values,
});
