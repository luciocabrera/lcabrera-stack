import { expect, it } from 'vite-plus/test';

import { enterpriseOrderSchema } from './enterpriseOrders.schema';

/** A fully valid raw form payload (strings as they arrive from FormData). */
const validInput = () => ({
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
  delivery_date: '',
  discount_percentage: '10',
  estimated_delivery_days: '3',
  internal_notes: '',
  is_fragile: false,
  is_gift: false,
  is_rush_order: true,
  is_vip_customer: true,
  loyalty_points: '120',
  order_date: '2024-02-01',
  order_notes: 'Leave at the door.',
  order_status: 'Pending',
  paid_amount: '50',
  payment_date: '',
  payment_method: 'Credit Card',
  payment_reference: '',
  payment_status: 'Partially Paid',
  priority: 'High',
  product_category: 'Electronics',
  product_subcategory: 'Laptops',
  quantity: '2',
  requires_signature: false,
  shipped_date: '',
  shipping_address_line1: '1 Infinite Loop',
  shipping_address_line2: '',
  shipping_city: 'Cupertino',
  shipping_cost: '5',
  shipping_country: 'USA',
  shipping_postal_code: '95014',
  shipping_state: 'CA',
  tracking_number: '',
  unit_price: '100',
  volume_m3: '0.5',
  warehouse_location: 'Warehouse A',
  weight_kg: '1.2',
});

it('accepts a fully valid payload and coerces numbers', () => {
  const result = enterpriseOrderSchema.safeParse(validInput());

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.quantity).toBe(2);
    expect(result.data.unit_price).toBe(100);
    expect(result.data.customer_rating).toBe(5);
    expect(result.data.discount_percentage).toBe(10);
  }
});

it('treats an empty customer_rating as absent (not zero)', () => {
  const result = enterpriseOrderSchema.safeParse({
    ...validInput(),
    customer_rating: '',
  });

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.customer_rating).toBeUndefined();
  }
});

it('required: rejects an empty customer_name', () => {
  const result = enterpriseOrderSchema.safeParse({
    ...validInput(),
    customer_name: '',
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.flatten().fieldErrors.customer_name?.[0]).toBe(
      'Customer name is required.',
    );
  }
});

it('maxLength: rejects a customer_name over 200 characters', () => {
  const result = enterpriseOrderSchema.safeParse({
    ...validInput(),
    customer_name: 'a'.repeat(201),
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.flatten().fieldErrors.customer_name?.[0]).toBe(
      'Customer name must be 200 characters or fewer.',
    );
  }
});

it('min: rejects a quantity below 1', () => {
  const result = enterpriseOrderSchema.safeParse({
    ...validInput(),
    quantity: '0',
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.flatten().fieldErrors.quantity?.[0]).toBe(
      'Quantity must be at least 1.',
    );
  }
});

it('max: rejects a discount above 100', () => {
  const result = enterpriseOrderSchema.safeParse({
    ...validInput(),
    discount_percentage: '150',
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.flatten().fieldErrors.discount_percentage?.[0]).toBe(
      'Discount cannot exceed 100%.',
    );
  }
});

it('min/max: rejects a customer_rating outside 1..5', () => {
  const result = enterpriseOrderSchema.safeParse({
    ...validInput(),
    customer_rating: '9',
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.flatten().fieldErrors.customer_rating?.[0]).toBe(
      'Rating must be between 1 and 5.',
    );
  }
});

it('regex: rejects a malformed email', () => {
  const result = enterpriseOrderSchema.safeParse({
    ...validInput(),
    customer_email: 'not-an-email',
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.flatten().fieldErrors.customer_email?.[0]).toBe(
      'Enter a valid email address.',
    );
  }
});

it('regex: rejects a malformed phone number', () => {
  const result = enterpriseOrderSchema.safeParse({
    ...validInput(),
    customer_phone: 'call-me',
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.flatten().fieldErrors.customer_phone?.[0]).toBe(
      'Enter a valid phone number.',
    );
  }
});

it('regex: rejects a malformed postal code', () => {
  const result = enterpriseOrderSchema.safeParse({
    ...validInput(),
    shipping_postal_code: '!!',
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.flatten().fieldErrors.shipping_postal_code?.[0]).toBe(
      'Enter a valid postal code.',
    );
  }
});

it('type: rejects an unknown enum value', () => {
  const result = enterpriseOrderSchema.safeParse({
    ...validInput(),
    order_status: 'Teleported',
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.flatten().fieldErrors.order_status?.[0]).toBe(
      'Select a valid order status.',
    );
  }
});

it('type: rejects a non-numeric quantity', () => {
  const result = enterpriseOrderSchema.safeParse({
    ...validInput(),
    quantity: 'lots',
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.flatten().fieldErrors.quantity).toBeDefined();
  }
});
