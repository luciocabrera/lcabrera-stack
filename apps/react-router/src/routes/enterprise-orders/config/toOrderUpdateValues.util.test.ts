import { expect, it } from 'vitest';

import { buildValidOrderInput } from './enterpriseOrders.fixtures';
import { toOrderUpdateValues } from './toOrderUpdateValues.util';

const now = new Date('2024-03-04T10:00:00.000Z');

it('refreshes updated_at and last_modified_by', () => {
  const values = toOrderUpdateValues({
    actor: 'system',
    input: buildValidOrderInput(),
    now,
  });

  expect(values.updated_at).toBe('2024-03-04T10:00:00.000Z');
  expect(values.last_modified_by).toBe('system');
});

it('recomputes the money totals from the edited inputs', () => {
  const values = toOrderUpdateValues({
    actor: 'system',
    input: { ...buildValidOrderInput(), quantity: 4, unit_price: 50 },
    now,
  });

  // subtotal = 50 * 4 = 200 -> same totals as the fixture's 100 * 2
  expect(values.subtotal).toBe(200);
  expect(values.total_amount).toBe(199.4);
});

it('never touches the immutable identity columns', () => {
  const values = toOrderUpdateValues({
    actor: 'system',
    input: buildValidOrderInput(),
    now,
  });

  expect(values).not.toHaveProperty('order_id');
  expect(values).not.toHaveProperty('order_number');
  expect(values).not.toHaveProperty('created_at');
  expect(values).not.toHaveProperty('order_timestamp');
});
