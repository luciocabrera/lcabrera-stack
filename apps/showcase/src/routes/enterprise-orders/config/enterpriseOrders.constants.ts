/**
 * The column list and enum values are copied (not imported) from the api layer on purpose
 * — that layer must never become a runtime dependency of this app (see the
 * feature plan §1).
 */

// Type-only (erased at build) — carries no `pg`/SQL runtime into this file.
import type { ColumnType } from '@lcabrera/server/db/query-builder/query-builder.types';
import type { ColumnSort } from '@lcabrera/server/sort/sort.types';

export const ENTERPRISE_ORDERS_SCHEMA = 'public';
export const ENTERPRISE_ORDERS_TABLE = 'enterprise_orders';

export const ENTERPRISE_ORDER_PRIMARY_KEY = 'order_id';

export const ENTERPRISE_ORDER_FALLBACK_SORT = [
  { columnKey: ENTERPRISE_ORDER_PRIMARY_KEY, direction: 'asc' },
] as const satisfies readonly ColumnSort[];

export const ENTERPRISE_ORDERS_PATH = '/enterprise-orders';

export const ENTERPRISE_ORDERS_GROUP_PATH = `${ENTERPRISE_ORDERS_PATH}/group`;

export const ENTERPRISE_ORDER_GROUP_MAX_ROWS = 5000;

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

export const ENTERPRISE_ORDER_LIST_COLUMNS = [
  'carrier',
  'customer_email',
  'customer_name',
  'customer_rating',
  'customer_type',
  'delivery_date',
  'discount_amount',
  'is_gift',
  'is_rush_order',
  'is_vip_customer',
  'loyalty_points',
  'order_date',
  'order_id',
  'order_number',
  'order_status',
  'payment_method',
  'payment_status',
  'priority',
  'product_category',
  'product_subcategory',
  'quantity',
  'shipped_date',
  'shipping_city',
  'shipping_cost',
  'shipping_country',
  'shipping_state',
  'subtotal',
  'tax_amount',
  'total_amount',
  'unit_price',
  'warehouse_location',
] as const;

export const ENTERPRISE_ORDER_ALLOWED_COLUMNS: readonly string[] =
  ENTERPRISE_ORDER_COLUMNS;

export const MAX_ENTERPRISE_ORDERS_LIMIT = 1000;

export const MAX_ENTERPRISE_ORDERS_SORT_RULES = ENTERPRISE_ORDER_COLUMNS.length;

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
