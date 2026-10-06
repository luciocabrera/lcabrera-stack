import { expect, it } from 'vite-plus/test';

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

  expect(result).toMatchObject({
    data: { customer_id: 42, quantity: 2 },
    success: true,
  });
});

it('fails for an invalid submission', () => {
  const result = parseOrderFormData(buildFormData({ customer_email: 'bad' }));

  expect(result.success).toBe(false);
});
