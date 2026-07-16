/**
 * Allow-list of distinct-value sources: `schema.table` → the set of columns
 * the generic /api/distinct endpoint may query. This is the authorization
 * boundary — parseDistinctSource validates every request against it before
 * any SQL is composed. A future DB-introspection feature can populate this
 * dynamically; today it is developer-curated.
 */
export const DISTINCT_SOURCES: Readonly<Record<string, ReadonlySet<string>>> = {
  'public.car_sales': new Set([
    'buyer_name',
    'city',
    'color',
    'country',
    'fuel_type',
    'model',
    'seller_name',
    'transmission',
  ]),
  'public.enterprise_orders': new Set([
    'carrier',
    'customer_email',
    'customer_name',
    'customer_type',
    'order_number',
    'order_status',
    'payment_method',
    'payment_status',
    'priority',
    'product_category',
    'product_subcategory',
    'shipping_city',
    'shipping_country',
    'shipping_state',
    'warehouse_location',
  ]),
};
