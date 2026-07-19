import { expect, it } from 'vitest';

import { buildValidOrderFormFields } from './enterpriseOrders.fixtures';
import { enterpriseOrderSchema } from './enterpriseOrders.schema';
import { readOrderFormValues } from './readOrderFormValues.util';

const buildFormData = () => {
  const formData = new FormData();
  for (const [name, value] of Object.entries(buildValidOrderFormFields())) {
    formData.set(name, value);
  }
  formData.set('customer_rating', '5');
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
