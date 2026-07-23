/**
 * Entity configuration for the `enterprise_orders` table.
 *
 * App-local, data + pure rules only — NO SQL and NO `pg` here. The generic
 * `@lcabrera/server` query builders/executors receive this configuration
 * (`schema`, `table`, column lists, `allowedColumns`) as plain data; the
 * enum value sets drive the Form select/radio options and the Zod schema.
 *
 * The column list and enum values are copied (not imported) from the api
 * layer on purpose — `apps/shared`/`api-shared` must never become a runtime
 * dependency of this app (see the feature plan §1).
 */

// Type-only (erased at build) — carries no `pg`/SQL runtime into this file.
import type { ColumnType } from '@lcabrera/server/db/query-builder/query-builder.types';

export const ENTERPRISE_ORDERS_SCHEMA = 'public';
export const ENTERPRISE_ORDERS_TABLE = 'enterprise_orders';

/** The list route the create/edit/view modals overlay and return to. */
export const ENTERPRISE_ORDERS_PATH = '/enterprise-orders';

/** Every column of `enterprise_orders`, in alphabetical order. */
export const ENTERPRISE_ORDER_COLUMNS = [
  'balance_due',
  'billing_address_line1',
  'billing_city',
  'billing_country',
  'billing_postal_code',
  'billing_state',
  'carrier',
  'created_at',
  'customer_email',
  'customer_id',
  'customer_name',
  'customer_phone',
  'customer_rating',
  'customer_since',
  'customer_type',
  'delivery_date',
  'discount_amount',
  'discount_percentage',
  'estimated_delivery_days',
  'internal_notes',
  'is_fragile',
  'is_gift',
  'is_rush_order',
  'is_vip_customer',
  'last_modified_by',
  'loyalty_points',
  'order_date',
  'order_id',
  'order_notes',
  'order_number',
  'order_status',
  'order_timestamp',
  'paid_amount',
  'payment_date',
  'payment_method',
  'payment_reference',
  'payment_status',
  'priority',
  'product_category',
  'product_subcategory',
  'quantity',
  'requires_signature',
  'shipped_date',
  'shipping_address_line1',
  'shipping_address_line2',
  'shipping_city',
  'shipping_cost',
  'shipping_country',
  'shipping_postal_code',
  'shipping_state',
  'subtotal',
  'tax_amount',
  'total_amount',
  'tracking_number',
  'unit_price',
  'updated_at',
  'volume_m3',
  'warehouse_location',
  'weight_kg',
] as const;

/**
 * Allow-list guarding every request-derived column that reaches a generic
 * query builder (filters/sort/projection). Passed as `allowedColumns` so a
 * column never listed here is rejected before it can reach SQL.
 */
export const ENTERPRISE_ORDER_ALLOWED_COLUMNS: readonly string[] =
  ENTERPRISE_ORDER_COLUMNS;

/**
 * Columns offered as distinct-value filter dropdowns, each mapped to its
 * `ColumnType` (consumed by `@lcabrera/server`'s `selectFilterOptions`, where
 * only `text` columns also exclude the empty string). This is the single source
 * the same-origin `/_api/filter-options` service derives from: its keys are the
 * distinct allow-list (a column absent here is rejected before any SQL runs).
 * Every one is a free-text / convention-enum `varchar`, so `text` is correct.
 */
export const ENTERPRISE_ORDER_DISTINCT_FILTER_COLUMNS: Readonly<
  Record<string, ColumnType>
> = {
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
};

// ---------------------------------------------------------------------------
// Enum value sets (convention-only in the DB — no CHECK constraints). Used for
// Form select/radio options and Zod `z.enum(...)` validation.
// ---------------------------------------------------------------------------

export const ORDER_STATUS_VALUES = [
  'Pending',
  'Processing',
  'On Hold',
  'Shipped',
  'Delivered',
  'Returned',
  'Refunded',
  'Cancelled',
] as const;

export const PRIORITY_VALUES = [
  'Low',
  'Normal',
  'High',
  'Urgent',
  'Critical',
] as const;

export const PAYMENT_STATUS_VALUES = [
  'Pending',
  'Partially Paid',
  'Paid',
  'Failed',
  'Refunded',
  'Cancelled',
] as const;

export const PAYMENT_METHOD_VALUES = [
  'Credit Card',
  'Debit Card',
  'PayPal',
  'Bank Transfer',
  'Cash',
  'Check',
  'Cryptocurrency',
] as const;

export const CUSTOMER_TYPE_VALUES = [
  'Individual',
  'Business',
  'Corporate',
  'Government',
  'Non-Profit',
] as const;

export const CARRIER_VALUES = [
  'FedEx',
  'UPS',
  'DHL',
  'USPS',
  'Amazon Logistics',
] as const;

export const WAREHOUSE_LOCATION_VALUES = [
  'Warehouse A',
  'Warehouse B',
  'Warehouse C',
  'Warehouse D',
  'Warehouse E',
] as const;

export const PRODUCT_CATEGORY_VALUES = [
  'Automotive',
  'Books',
  'Clothing',
  'Electronics',
  'Food',
  'Furniture',
  'Garden',
  'Health',
  'Sports',
  'Toys',
] as const;
