import { isCheckboxChecked } from '@lcabrera/utils/forms/is-checkbox-checked.util';
import { readFormString } from '@lcabrera/utils/forms/read-form-string.util';

export type ReadOrderFormValuesArgs = {
  readonly formData: FormData;
};

export const readOrderFormValues = ({ formData }: ReadOrderFormValuesArgs) => ({
  billing_address_line1: readFormString({
    formData,
    name: 'billing_address_line1',
  }),
  billing_city: readFormString({ formData, name: 'billing_city' }),
  billing_country: readFormString({ formData, name: 'billing_country' }),
  billing_postal_code: readFormString({
    formData,
    name: 'billing_postal_code',
  }),
  billing_state: readFormString({ formData, name: 'billing_state' }),
  carrier: readFormString({ formData, name: 'carrier' }),
  customer_email: readFormString({ formData, name: 'customer_email' }),
  customer_id: readFormString({ formData, name: 'customer_id' }),
  customer_name: readFormString({ formData, name: 'customer_name' }),
  customer_phone: readFormString({ formData, name: 'customer_phone' }),
  customer_rating: readFormString({ formData, name: 'customer_rating' }),
  customer_since: readFormString({ formData, name: 'customer_since' }),
  customer_type: readFormString({ formData, name: 'customer_type' }),
  delivery_date: readFormString({ formData, name: 'delivery_date' }),
  discount_percentage: readFormString({
    formData,
    name: 'discount_percentage',
  }),
  estimated_delivery_days: readFormString({
    formData,
    name: 'estimated_delivery_days',
  }),
  internal_notes: readFormString({ formData, name: 'internal_notes' }),
  is_fragile: isCheckboxChecked({ formData, name: 'is_fragile' }),
  is_gift: isCheckboxChecked({ formData, name: 'is_gift' }),
  is_rush_order: isCheckboxChecked({ formData, name: 'is_rush_order' }),
  is_vip_customer: isCheckboxChecked({ formData, name: 'is_vip_customer' }),
  loyalty_points: readFormString({ formData, name: 'loyalty_points' }),
  order_date: readFormString({ formData, name: 'order_date' }),
  order_notes: readFormString({ formData, name: 'order_notes' }),
  order_status: readFormString({ formData, name: 'order_status' }),
  paid_amount: readFormString({ formData, name: 'paid_amount' }),
  payment_date: readFormString({ formData, name: 'payment_date' }),
  payment_method: readFormString({ formData, name: 'payment_method' }),
  payment_reference: readFormString({ formData, name: 'payment_reference' }),
  payment_status: readFormString({ formData, name: 'payment_status' }),
  priority: readFormString({ formData, name: 'priority' }),
  product_category: readFormString({ formData, name: 'product_category' }),
  product_subcategory: readFormString({
    formData,
    name: 'product_subcategory',
  }),
  quantity: readFormString({ formData, name: 'quantity' }),
  requires_signature: isCheckboxChecked({
    formData,
    name: 'requires_signature',
  }),
  shipped_date: readFormString({ formData, name: 'shipped_date' }),
  shipping_address_line1: readFormString({
    formData,
    name: 'shipping_address_line1',
  }),
  shipping_address_line2: readFormString({
    formData,
    name: 'shipping_address_line2',
  }),
  shipping_city: readFormString({ formData, name: 'shipping_city' }),
  shipping_cost: readFormString({ formData, name: 'shipping_cost' }),
  shipping_country: readFormString({ formData, name: 'shipping_country' }),
  shipping_postal_code: readFormString({
    formData,
    name: 'shipping_postal_code',
  }),
  shipping_state: readFormString({ formData, name: 'shipping_state' }),
  tracking_number: readFormString({ formData, name: 'tracking_number' }),
  unit_price: readFormString({ formData, name: 'unit_price' }),
  volume_m3: readFormString({ formData, name: 'volume_m3' }),
  warehouse_location: readFormString({ formData, name: 'warehouse_location' }),
  weight_kg: readFormString({ formData, name: 'weight_kg' }),
});
