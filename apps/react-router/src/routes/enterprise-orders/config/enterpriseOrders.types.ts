import type { GroupCardinalityWarning } from '@lcabrera/server/db/group-query-builder/group-query-builder.types';
import type { SerializableDbError } from '@lcabrera/server/errors/errors.types';
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
 * A row a grouped read returns: the group summary, and none of the table's own
 * columns. Declaring the column members as `never` is what makes the union
 * below discriminated — reading one off a row TypeScript has not narrowed is an
 * error, rather than silently `T | undefined`.
 */
export type EnterpriseOrderGroupRow = TableGroupRow & {
  readonly [K in keyof EnterpriseOrderListRow]?: never;
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
  /**
   * Why the read returned nothing, as **plain data**. A grouped read can be
   * refused (too deep, an illegal key, a result bound past the ceiling) or cut
   * off by its statement timeout, and `@lcabrera/server` raises each as a typed
   * error class — which React Router single fetch silently strips of its
   * prototype on the way here. The loader edge maps it through
   * `toSerializableDbError` so the client gets a discriminant instead of a
   * shape it cannot recognise (ADR-050, ADR-066).
   */
  readonly error?: SerializableDbError;
  /**
   * The grouped read ran, and something about it is worth saying: the estimate
   * was above the warn threshold, or the table has no statistics to estimate
   * from at all. The data below is real either way — this is not an error.
   */
  readonly groupingWarning?: GroupCardinalityWarning;
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
 * A row as the list **table** renders it: either a data row with every
 * projected column, or one group summary with none of them.
 *
 * A union rather than a `Partial` of both, because that is the shape of the
 * truth — a grouped read projects the group key and its aggregates and nothing
 * else, so "any field may be missing from any row" would be a weaker claim than
 * the data supports. `getTableGroupRowSummary` is the runtime discriminant and
 * `TABLE_GROUP_ROW_FIELD` is the type-level one, so a consumer that checks for
 * a summary narrows to one arm and reads the other arm's columns without a
 * guard.
 *
 * `EnterpriseOrderListRow` is untouched and is still exactly what the ungrouped
 * query returns; the `Pick` behind it still turns a cell reading an unprojected
 * column into a compile error.
 *
 * One consequence worth knowing: a discriminant has to exist on both arms, and
 * `DataKey<TData>` is `keyof TData`, so `tableGroup` is accepted where a column
 * key is expected on this route. It is inert — no such column is declared, and
 * the colocated constants test pins `COLUMNS` to the projected list — and
 * closing it would mean changing `TableColumn`'s own key/render typing in
 * `@lcabrera/ui`, which is a package decision rather than a route one.
 */
export type EnterpriseOrderTableRow =
  | EnterpriseOrderGroupRow
  | (EnterpriseOrderListRow & { readonly tableGroup?: never });

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
