import { expect, it } from 'vitest';

import { enterpriseOrderSchema } from './enterpriseOrders.schema';
import { readOrderFormValues } from './readOrderFormValues.util';

const buildFormData = () => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    billing_address_line1: '221B Baker Street',
    billing_city: 'London',
    billing_country: 'UK',
    billing_postal_code: 'NW1 6XE',
    billing_state: 'Greater London',
    carrier: 'FedEx',
    customer_email: 'ada@example.com',
    customer_id: '42',
    customer_name: 'Ada Lovelace',
    customer_phone: '+1 (555) 123-4567',
    customer_rating: '5',
    customer_since: '2020-01-01',
    customer_type: 'Individual',
    discount_percentage: '10',
    estimated_delivery_days: '3',
    loyalty_points: '120',
    order_date: '2024-02-01',
    order_status: 'Pending',
    paid_amount: '50',
    payment_method: 'Credit Card',
    payment_status: 'Partially Paid',
    priority: 'High',
    product_category: 'Electronics',
    product_subcategory: 'Laptops',
    quantity: '2',
    shipping_address_line1: '1 Infinite Loop',
    shipping_city: 'Cupertino',
    shipping_cost: '5',
    shipping_country: 'USA',
    shipping_postal_code: '95014',
    shipping_state: 'CA',
    unit_price: '100',
    volume_m3: '0.5',
    warehouse_location: 'Warehouse A',
    weight_kg: '1.2',
  };
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }
  formData.set('is_rush_order', 'on');
  formData.set('is_vip_customer', 'on');
  return formData;
};

it('reads flags as booleans and other fields as strings', () => {
  const values = readOrderFormValues({ formData: buildFormData() });

  expect(values.is_rush_order).toBe(true);
  expect(values.is_vip_customer).toBe(true);
  expect(values.is_gift).toBe(false);
  expect(values.is_fragile).toBe(false);
  expect(values.requires_signature).toBe(false);
  expect(values.customer_name).toBe('Ada Lovelace');
  expect(values.quantity).toBe('2');
});

it('produces a payload the schema accepts', () => {
  const values = readOrderFormValues({ formData: buildFormData() });
  const result = enterpriseOrderSchema.safeParse(values);

  expect(result.success).toBe(true);
});

it('defaults omitted optional fields to empty strings', () => {
  const values = readOrderFormValues({ formData: buildFormData() });

  expect(values.tracking_number).toBe('');
  expect(values.order_notes).toBe('');
  expect(values.payment_date).toBe('');
});
