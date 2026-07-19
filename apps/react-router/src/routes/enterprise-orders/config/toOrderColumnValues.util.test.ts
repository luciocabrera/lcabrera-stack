import { expect, it } from 'vitest';

import { buildValidOrderInput } from './enterpriseOrders.fixtures';
import { toOrderColumnValues } from './toOrderColumnValues.util';

it('injects the derived money totals', () => {
  const values = toOrderColumnValues({ input: buildValidOrderInput() });

  expect(values.subtotal).toBe(200);
  expect(values.discount_amount).toBe(20);
  expect(values.tax_amount).toBe(14.4);
  expect(values.total_amount).toBe(199.4);
  expect(values.balance_due).toBe(149.4);
});

it('collapses empty optional strings to undefined (SQL NULL)', () => {
  const values = toOrderColumnValues({ input: buildValidOrderInput() });

  expect(values.tracking_number).toBeUndefined();
  expect(values.payment_date).toBeUndefined();
  expect(values.shipping_address_line2).toBeUndefined();
  expect(values.internal_notes).toBeUndefined();
});

it('passes an absent customer_rating through as undefined', () => {
  const values = toOrderColumnValues({
    input: { ...buildValidOrderInput(), customer_rating: undefined },
  });

  expect(values.customer_rating).toBeUndefined();
});

it('does not include server-assigned identity/audit columns', () => {
  const values = toOrderColumnValues({ input: buildValidOrderInput() });

  expect(values).not.toHaveProperty('order_id');
  expect(values).not.toHaveProperty('order_number');
  expect(values).not.toHaveProperty('created_at');
  expect(values).not.toHaveProperty('updated_at');
});
