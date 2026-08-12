import type { TableGroupRow } from '@lcabrera/ui/components/Table/Table.types';

import type { ENTERPRISE_ORDER_LIST_COLUMNS } from './enterpriseOrders.constants';

/**
 * Client-safe types for the `enterprise_orders` entity.
 *
 * `EnterpriseOrder` mirrors a row as it comes back from Postgres through the
 * generic `selectRows` executor: `numeric` columns arrive as strings and
 * nullable columns as `null`. `EnterpriseOrderValues` is the Form value shape
 * — semantic types (numbers/booleans/strings) the Form seeds from and the Zod
 * schema validates into.
 */

/** A single `enterprise_orders` row (serializable — safe to return from a loader). */
export type EnterpriseOrder = {
  readonly balance_due: string;
  readonly billing_address_line1: string;
  readonly billing_city: string;
  readonly billing_country: string;
  readonly billing_postal_code: string;
  readonly billing_state: string;
  readonly carrier: string;
  readonly created_at: string;
  readonly customer_email: string;
  readonly customer_id: number;
  readonly customer_name: string;
  readonly customer_phone: string;
  readonly customer_rating: null | number;
  readonly customer_since: string;
  readonly customer_type: string;
  readonly delivery_date: null | string;
  readonly discount_amount: string;
  readonly discount_percentage: string;
  readonly estimated_delivery_days: number;
  readonly internal_notes: null | string;
  readonly is_fragile: boolean;
  readonly is_gift: boolean;
  readonly is_rush_order: boolean;
  readonly is_vip_customer: boolean;
  readonly last_modified_by: string;
  readonly loyalty_points: number;
  readonly order_date: string;
  readonly order_id: number;
  readonly order_notes: null | string;
  readonly order_number: string;
  readonly order_status: string;
  readonly order_timestamp: string;
  readonly paid_amount: string;
  readonly payment_date: null | string;
  readonly payment_method: string;
  readonly payment_reference: null | string;
  readonly payment_status: string;
  readonly priority: string;
  readonly product_category: string;
  readonly product_subcategory: string;
  readonly quantity: number;
  readonly requires_signature: boolean;
  readonly shipped_date: null | string;
  readonly shipping_address_line1: string;
  readonly shipping_address_line2: null | string;
  readonly shipping_city: string;
  readonly shipping_cost: string;
  readonly shipping_country: string;
  readonly shipping_postal_code: string;
  readonly shipping_state: string;
  readonly subtotal: string;
  readonly tax_amount: string;
  readonly total_amount: string;
  readonly tracking_number: null | string;
  readonly unit_price: string;
  readonly updated_at: string;
  readonly volume_m3: string;
  readonly warehouse_location: string;
  readonly weight_kg: string;
};

/**
 * A row as the **list** query returns it — the read model of
 * `ENTERPRISE_ORDER_LIST_COLUMNS`, not the whole table row (#405). Typing it as
 * a `Pick` is what stops a cell reading a column the query no longer selects:
 * that becomes a compile error rather than a blank cell.
 */
export type EnterpriseOrderListRow = Pick<
  EnterpriseOrder,
  (typeof ENTERPRISE_ORDER_LIST_COLUMNS)[number]
>;

export type EnterpriseOrdersResponse = {
  readonly data: readonly EnterpriseOrderTableRow[];
  readonly hasMore: boolean;
  /**
   * Rows matching the current filters — present only on the **first** page of a
   * scroll session (#402). The total cannot change while the session runs, so
   * later pages omit it and the table keeps the one it has rather than making
   * the database re-count the filtered set per page.
   */
  readonly total?: number;
};

/**
 * A row as the list **table** renders it, which is not the same as a row the
 * list query returns.
 *
 * A grouped read projects the group key and its aggregates and nothing else, so
 * every other column is genuinely absent from those rows — the members are
 * optional here because that is the truth, not to relax the read model.
 * `EnterpriseOrderListRow` keeps its exact shape and is still what the
 * ungrouped query returns; the `Pick` behind it still turns a cell reading an
 * unprojected column into a compile error.
 */
export type EnterpriseOrderTableRow = Partial<EnterpriseOrderListRow> &
  Partial<TableGroupRow>;

/**
 * Form value shape for create/edit/view. Money and quantity are numbers,
 * dates are ISO strings, flags are booleans, enums are their string unions.
 * Server-assigned (`order_id`/`order_number`/audit) and computed-money fields
 * are present so the Form can display them read-only in edit/view.
 */
export type EnterpriseOrderValues = {
  readonly balance_due: number;
  readonly billing_address_line1: string;
  readonly billing_city: string;
  readonly billing_country: string;
  readonly billing_postal_code: string;
  readonly billing_state: string;
  readonly carrier: string;
  readonly created_at: string;
  readonly customer_email: string;
  readonly customer_id: number;
  readonly customer_name: string;
  readonly customer_phone: string;
  readonly customer_rating: null | number;
  readonly customer_since: string;
  readonly customer_type: string;
  readonly delivery_date: string;
  readonly discount_amount: number;
  readonly discount_percentage: number;
  readonly estimated_delivery_days: number;
  readonly internal_notes: string;
  readonly is_fragile: boolean;
  readonly is_gift: boolean;
  readonly is_rush_order: boolean;
  readonly is_vip_customer: boolean;
  readonly last_modified_by: string;
  readonly loyalty_points: number;
  readonly order_date: string;
  readonly order_id: number;
  readonly order_notes: string;
  readonly order_number: string;
  readonly order_status: string;
  readonly order_timestamp: string;
  readonly paid_amount: number;
  readonly payment_date: string;
  readonly payment_method: string;
  readonly payment_reference: string;
  readonly payment_status: string;
  readonly priority: string;
  readonly product_category: string;
  readonly product_subcategory: string;
  readonly quantity: number;
  readonly requires_signature: boolean;
  readonly shipped_date: string;
  readonly shipping_address_line1: string;
  readonly shipping_address_line2: string;
  readonly shipping_city: string;
  readonly shipping_cost: number;
  readonly shipping_country: string;
  readonly shipping_postal_code: string;
  readonly shipping_state: string;
  readonly subtotal: number;
  readonly tax_amount: number;
  readonly total_amount: number;
  readonly tracking_number: string;
  readonly unit_price: number;
  readonly updated_at: string;
  readonly volume_m3: number;
  readonly warehouse_location: string;
  readonly weight_kg: number;
};
