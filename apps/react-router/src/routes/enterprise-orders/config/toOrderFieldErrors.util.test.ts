import { expect, it } from 'vite-plus/test';

import { buildValidOrderInput } from './enterpriseOrders.fixtures';
import { enterpriseOrderSchema } from './enterpriseOrders.schema';
import { toOrderFieldErrors } from './toOrderFieldErrors.util';

it('maps each failing field to its first message', () => {
  const result = enterpriseOrderSchema.safeParse({
    ...buildValidOrderInput(),
    customer_email: 'nope',
    customer_name: '',
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    const errors = toOrderFieldErrors({ error: result.error });

    expect(errors.customer_name).toBe('Customer name is required.');
    expect(errors.customer_email).toBe('Enter a valid email address.');
  }
});

it('is empty for a valid payload', () => {
  const result = enterpriseOrderSchema.safeParse(buildValidOrderInput());

  expect(result.success).toBe(true);
  if (result.success) {
    return;
  }

  expect(toOrderFieldErrors({ error: result.error })).toStrictEqual({});
});
