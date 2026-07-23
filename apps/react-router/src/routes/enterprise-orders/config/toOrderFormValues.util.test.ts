import { expect, it } from 'vite-plus/test';

import type { EnterpriseOrder } from './enterpriseOrders.types';

import { toOrderFormValues } from './toOrderFormValues.util';

/**
 * The nullable columns arrive as SQL NULL from the driver — build them from
 * parsed JSON rather than with `null` literals (repo convention, mirrors
 * `drop-nullish-values.util.test.ts`).
 */
const nullableColumns = () =>
  JSON.parse(
    '{"delivery_date":null,"internal_notes":null,"payment_date":null,"payment_reference":null,"shipped_date":null,"shipping_address_line2":null,"tracking_number":null}',
  ) as Pick<
    EnterpriseOrder,
    | 'delivery_date'
    | 'internal_notes'
    | 'payment_date'
    | 'payment_reference'
    | 'shipped_date'
    | 'shipping_address_line2'
    | 'tracking_number'
  >;

const buildOrder = (
  overrides: Partial<EnterpriseOrder> = {},
): EnterpriseOrder => ({
  ...nullableColumns(),
  balance_due: '149.40',
  billing_address_line1: '221B Baker Street',
  billing_city: 'London',
  billing_country: 'UK',
  billing_postal_code: 'NW1 6XE',
  billing_state: 'Greater London',
  carrier: 'FedEx',
  created_at: '2024-03-04T10:00:00.000Z',
  customer_email: 'ada@example.com',
  customer_id: 42,
  customer_name: 'Ada Lovelace',
  customer_phone: '+1 (555) 123-4567',
  customer_rating: 5,
  customer_since: '2020-01-01',
  customer_type: 'Individual',
  discount_amount: '20.00',
  discount_percentage: '10.00',
  estimated_delivery_days: 3,
  is_fragile: false,
  is_gift: false,
  is_rush_order: true,
  is_vip_customer: true,
  last_modified_by: 'system',
  loyalty_points: 120,
  order_date: '2024-02-01',
  order_id: 7,
  order_notes: 'Leave at the door.',
  order_number: 'ORD-00000007',
  order_status: 'Pending',
  order_timestamp: '2024-03-04T10:00:00.000Z',
  paid_amount: '50.00',
  payment_method: 'Credit Card',
  payment_status: 'Partially Paid',
  priority: 'High',
  product_category: 'Electronics',
  product_subcategory: 'Laptops',
  quantity: 2,
  requires_signature: false,
  shipping_address_line1: '1 Infinite Loop',
  shipping_city: 'Cupertino',
  shipping_cost: '5.00',
  shipping_country: 'USA',
  shipping_postal_code: '95014',
  shipping_state: 'CA',
  subtotal: '200.00',
  tax_amount: '14.40',
  total_amount: '199.40',
  unit_price: '100.00',
  updated_at: '2024-03-04T10:00:00.000Z',
  volume_m3: '0.5000',
  warehouse_location: 'Warehouse A',
  weight_kg: '1.20',
  ...overrides,
});

it('coerces numeric string columns to numbers', () => {
  const values = toOrderFormValues(buildOrder());

  expect(values.subtotal).toBe(200);
  expect(values.total_amount).toBe(199.4);
  expect(values.unit_price).toBe(100);
  expect(values.weight_kg).toBe(1.2);
});

it('collapses nullable columns to empty strings', () => {
  const values = toOrderFormValues(buildOrder());

  expect(values.payment_date).toBe('');
  expect(values.tracking_number).toBe('');
  expect(values.internal_notes).toBe('');
  expect(values.shipping_address_line2).toBe('');
});

it('passes through non-null strings, numbers and booleans', () => {
  const values = toOrderFormValues(buildOrder());

  expect(values.order_number).toBe('ORD-00000007');
  expect(values.order_id).toBe(7);
  expect(values.customer_rating).toBe(5);
  expect(values.is_rush_order).toBe(true);
});
