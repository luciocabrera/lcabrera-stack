import { emptyToUndefined } from '@repo/utils/strings/empty-to-undefined.util';

import type { EnterpriseOrderInput } from './enterpriseOrders.schema';

import { deriveOrderTotals } from './deriveOrderTotals.util';

export type ToOrderColumnValuesArgs = {
  readonly input: EnterpriseOrderInput;
};

/**
 * Map a validated order payload to the column→value record shared by insert
 * and update: every user-editable column plus the five computed money columns
 * (`deriveOrderTotals`). Optional string fields collapse to `null`; the
 * server-assigned identity/audit columns are added by the insert/update
 * wrappers, not here.
 */
export const toOrderColumnValues = ({ input }: ToOrderColumnValuesArgs) => {
  const totals = deriveOrderTotals({
    discountPercentage: input.discount_percentage,
    paidAmount: input.paid_amount,
    quantity: input.quantity,
    shippingCost: input.shipping_cost,
    unitPrice: input.unit_price,
  });

  return {
    balance_due: totals.balance_due,
    billing_address_line1: input.billing_address_line1,
    billing_city: input.billing_city,
    billing_country: input.billing_country,
    billing_postal_code: input.billing_postal_code,
    billing_state: input.billing_state,
    carrier: input.carrier,
    customer_email: input.customer_email,
    customer_id: input.customer_id,
    customer_name: input.customer_name,
    customer_phone: input.customer_phone,
    customer_rating: input.customer_rating,
    customer_since: input.customer_since,
    customer_type: input.customer_type,
    delivery_date: emptyToUndefined(input.delivery_date),
    discount_amount: totals.discount_amount,
    discount_percentage: input.discount_percentage,
    estimated_delivery_days: input.estimated_delivery_days,
    internal_notes: emptyToUndefined(input.internal_notes),
    is_fragile: input.is_fragile,
    is_gift: input.is_gift,
    is_rush_order: input.is_rush_order,
    is_vip_customer: input.is_vip_customer,
    loyalty_points: input.loyalty_points,
    order_date: input.order_date,
    order_notes: emptyToUndefined(input.order_notes),
    order_status: input.order_status,
    paid_amount: input.paid_amount,
    payment_date: emptyToUndefined(input.payment_date),
    payment_method: input.payment_method,
    payment_reference: emptyToUndefined(input.payment_reference),
    payment_status: input.payment_status,
    priority: input.priority,
    product_category: input.product_category,
    product_subcategory: input.product_subcategory,
    quantity: input.quantity,
    requires_signature: input.requires_signature,
    shipped_date: emptyToUndefined(input.shipped_date),
    shipping_address_line1: input.shipping_address_line1,
    shipping_address_line2: emptyToUndefined(input.shipping_address_line2),
    shipping_city: input.shipping_city,
    shipping_cost: input.shipping_cost,
    shipping_country: input.shipping_country,
    shipping_postal_code: input.shipping_postal_code,
    shipping_state: input.shipping_state,
    subtotal: totals.subtotal,
    tax_amount: totals.tax_amount,
    total_amount: totals.total_amount,
    tracking_number: emptyToUndefined(input.tracking_number),
    unit_price: input.unit_price,
    volume_m3: input.volume_m3,
    warehouse_location: input.warehouse_location,
    weight_kg: input.weight_kg,
  };
};
