import type { FilterOptionsSources } from '@lcabrera/server/filters/resolve-filter-options-source.util';

/**
 * Allow-list of distinct-value sources: `schema.table` → the columns the
 * generic /api/distinct endpoint may query, each with the type its values are
 * read as. This is the authorization boundary — `parseDistinctSource` validates
 * every request against it, through `@lcabrera/server`'s
 * `resolveFilterOptionsSource`, before any SQL is composed. A future
 * DB-introspection feature can populate this dynamically; today it is
 * developer-curated.
 *
 * Every source here exposes text columns only, which is what makes the
 * endpoint's empty-string exclusion apply: `selectFilterOptions` drops `''` for
 * `text` and for nothing else.
 */
export const DISTINCT_SOURCES: FilterOptionsSources = {
  'public.car_sales': {
    buyer_name: 'text',
    city: 'text',
    color: 'text',
    country: 'text',
    fuel_type: 'text',
    model: 'text',
    seller_name: 'text',
    transmission: 'text',
  },
  'public.enterprise_orders': {
    carrier: 'text',
    customer_email: 'text',
    customer_name: 'text',
    customer_type: 'text',
    order_number: 'text',
    order_status: 'text',
    payment_method: 'text',
    payment_status: 'text',
    priority: 'text',
    product_category: 'text',
    product_subcategory: 'text',
    shipping_city: 'text',
    shipping_country: 'text',
    shipping_state: 'text',
    warehouse_location: 'text',
  },
};
