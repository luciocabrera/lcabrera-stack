import { z } from 'zod';

import {
  CARRIER_VALUES,
  CUSTOMER_TYPE_VALUES,
  ORDER_STATUS_VALUES,
  PAYMENT_METHOD_VALUES,
  PAYMENT_STATUS_VALUES,
  PRIORITY_VALUES,
  PRODUCT_CATEGORY_VALUES,
  WAREHOUSE_LOCATION_VALUES,
} from './enterpriseOrders.constants';

/** Validation patterns exercised by the create/edit forms (feature plan §2). */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^\+?\d[\d\s().-]{6,29}$/;
export const POSTAL_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\s-]{2,19}$/;
export const ORDER_NUMBER_PATTERN = /^ORD-\d{8}$/;

/**
 * Optional numeric field: an empty form value becomes `undefined` (absent)
 * rather than coercing to `0`, so a blank rating is not silently stored as a
 * real zero.
 */
const optionalRating = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce
    .number()
    .min(1, 'Rating must be between 1 and 5.')
    .max(5, 'Rating must be between 1 and 5.')
    .optional(),
);

/**
 * The shared create/update gate for an enterprise order. Every validation kind
 * from the showcase matrix is exercised: required (`min(1)`), min/max
 * (`quantity`, `discount_percentage`, `customer_rating`), minLength/maxLength
 * (`customer_name`, postal codes), regex (`customer_email`, `customer_phone`,
 * postal codes) and type (enums + coerced numbers). FormData arrives as
 * strings, so numbers are coerced and booleans are pre-normalised by
 * `readOrderFormValues`.
 */
export const enterpriseOrderSchema = z.object({
  billing_address_line1: z
    .string()
    .trim()
    .min(1, 'Billing address is required.')
    .max(200, 'Billing address must be 200 characters or fewer.'),
  billing_city: z.string().trim().min(1, 'Billing city is required.').max(100),
  billing_country: z
    .string()
    .trim()
    .min(1, 'Billing country is required.')
    .max(100),
  billing_postal_code: z
    .string()
    .trim()
    .min(1, 'Billing postal code is required.')
    .max(20, 'Postal code must be 20 characters or fewer.')
    .regex(POSTAL_CODE_PATTERN, 'Enter a valid postal code.'),
  billing_state: z
    .string()
    .trim()
    .min(1, 'Billing state is required.')
    .max(100),
  carrier: z.enum(CARRIER_VALUES, { error: 'Select a valid carrier.' }),
  customer_email: z
    .string()
    .trim()
    .min(1, 'Customer email is required.')
    .max(200)
    .regex(EMAIL_PATTERN, 'Enter a valid email address.'),
  customer_id: z.coerce
    .number()
    .int('Customer ID must be a whole number.')
    .positive('Customer ID is required.'),
  customer_name: z
    .string()
    .trim()
    .min(1, 'Customer name is required.')
    .max(200, 'Customer name must be 200 characters or fewer.'),
  customer_phone: z
    .string()
    .trim()
    .min(1, 'Customer phone is required.')
    .max(30)
    .regex(PHONE_PATTERN, 'Enter a valid phone number.'),
  customer_rating: optionalRating,
  customer_since: z.string().trim().min(1, 'Customer since date is required.'),
  customer_type: z.enum(CUSTOMER_TYPE_VALUES, {
    error: 'Select a valid customer type.',
  }),
  delivery_date: z.string().trim().max(40),
  discount_percentage: z.coerce
    .number()
    .min(0, 'Discount cannot be negative.')
    .max(100, 'Discount cannot exceed 100%.'),
  estimated_delivery_days: z.coerce
    .number()
    .int('Estimated delivery days must be a whole number.')
    .min(0, 'Estimated delivery days cannot be negative.'),
  internal_notes: z.string().trim().max(2000),
  is_fragile: z.boolean(),
  is_gift: z.boolean(),
  is_rush_order: z.boolean(),
  is_vip_customer: z.boolean(),
  loyalty_points: z.coerce
    .number()
    .int('Loyalty points must be a whole number.')
    .min(0, 'Loyalty points cannot be negative.'),
  order_date: z.string().trim().min(1, 'Order date is required.'),
  order_notes: z.string().trim().max(2000),
  order_status: z.enum(ORDER_STATUS_VALUES, {
    error: 'Select a valid order status.',
  }),
  paid_amount: z.coerce.number().min(0, 'Paid amount cannot be negative.'),
  payment_date: z.string().trim().max(40),
  payment_method: z.enum(PAYMENT_METHOD_VALUES, {
    error: 'Select a valid payment method.',
  }),
  payment_reference: z.string().trim().max(100),
  payment_status: z.enum(PAYMENT_STATUS_VALUES, {
    error: 'Select a valid payment status.',
  }),
  priority: z.enum(PRIORITY_VALUES, { error: 'Select a valid priority.' }),
  product_category: z.enum(PRODUCT_CATEGORY_VALUES, {
    error: 'Select a valid product category.',
  }),
  product_subcategory: z
    .string()
    .trim()
    .min(1, 'Product subcategory is required.')
    .max(100),
  quantity: z.coerce
    .number()
    .int('Quantity must be a whole number.')
    .min(1, 'Quantity must be at least 1.'),
  requires_signature: z.boolean(),
  shipped_date: z.string().trim().max(40),
  shipping_address_line1: z
    .string()
    .trim()
    .min(1, 'Shipping address is required.')
    .max(200, 'Shipping address must be 200 characters or fewer.'),
  shipping_address_line2: z.string().trim().max(200),
  shipping_city: z
    .string()
    .trim()
    .min(1, 'Shipping city is required.')
    .max(100),
  shipping_cost: z.coerce.number().min(0, 'Shipping cost cannot be negative.'),
  shipping_country: z
    .string()
    .trim()
    .min(1, 'Shipping country is required.')
    .max(100),
  shipping_postal_code: z
    .string()
    .trim()
    .min(1, 'Shipping postal code is required.')
    .max(20, 'Postal code must be 20 characters or fewer.')
    .regex(POSTAL_CODE_PATTERN, 'Enter a valid postal code.'),
  shipping_state: z
    .string()
    .trim()
    .min(1, 'Shipping state is required.')
    .max(100),
  tracking_number: z.string().trim().max(100),
  unit_price: z.coerce.number().min(0, 'Unit price cannot be negative.'),
  volume_m3: z.coerce.number().min(0, 'Volume cannot be negative.'),
  warehouse_location: z.enum(WAREHOUSE_LOCATION_VALUES, {
    error: 'Select a valid warehouse.',
  }),
  weight_kg: z.coerce.number().min(0, 'Weight cannot be negative.'),
});

/** The validated create/update payload (post-coercion). */
export type EnterpriseOrderInput = z.infer<typeof enterpriseOrderSchema>;
