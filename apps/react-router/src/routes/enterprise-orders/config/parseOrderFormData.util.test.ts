import { expect, it } from 'vitest';

import { buildValidOrderFormFields } from './enterpriseOrders.fixtures';
import { parseOrderFormData } from './parseOrderFormData.util';

const buildFormData = (overrides: Record<string, string> = {}) => {
  const formData = new FormData();
  const fields = { ...buildValidOrderFormFields(), ...overrides };
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }
  return formData;
};

it('parses and coerces a valid submission', () => {
  const result = parseOrderFormData(buildFormData());

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.quantity).toBe(2);
    expect(result.data.customer_id).toBe(42);
  }
});

it('fails for an invalid submission', () => {
  const result = parseOrderFormData(buildFormData({ customer_email: 'bad' }));

  expect(result.success).toBe(false);
});
