import { expect, it } from 'vitest';

import { buildValidOrderInput } from './enterpriseOrders.fixtures';
import { toOrderInsertValues } from './toOrderInsertValues.util';

const now = new Date('2024-03-04T10:00:00.000Z');

it('assigns the identity and audit columns', () => {
  const values = toOrderInsertValues({
    actor: 'system',
    input: buildValidOrderInput(),
    now,
    orderId: 7,
  });

  expect(values.order_id).toBe(7);
  expect(values.order_number).toBe('ORD-00000007');
  expect(values.created_at).toBe('2024-03-04T10:00:00.000Z');
  expect(values.updated_at).toBe('2024-03-04T10:00:00.000Z');
  expect(values.order_timestamp).toBe('2024-03-04T10:00:00.000Z');
  expect(values.last_modified_by).toBe('system');
});

it('carries the shared editable + computed columns through', () => {
  const values = toOrderInsertValues({
    actor: 'system',
    input: buildValidOrderInput(),
    now,
    orderId: 7,
  });

  expect(values.customer_name).toBe('Ada Lovelace');
  expect(values.total_amount).toBe(199.4);
});
