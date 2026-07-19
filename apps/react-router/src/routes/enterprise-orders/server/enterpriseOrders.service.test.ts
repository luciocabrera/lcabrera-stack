import { deleteRows } from '@repo/data-access/db/deleteRows.util';
import { getMaxValue } from '@repo/data-access/db/getMaxValue.util';
import { insertRow } from '@repo/data-access/db/insertRow.util';
import { selectRows } from '@repo/data-access/db/selectRows.util';
import { updateRows } from '@repo/data-access/db/updateRows.util';
import { expect, it, vi } from 'vitest';

import {
  deleteOrder,
  getNextOrderId,
  insertOrder,
  selectOrderById,
  updateOrder,
} from './enterpriseOrders.service';

vi.mock('@repo/data-access/db/deleteRows.util', () => ({
  deleteRows: vi.fn(async () => []),
}));
vi.mock('@repo/data-access/db/getMaxValue.util', () => ({
  getMaxValue: vi.fn(async () => 41),
}));
vi.mock('@repo/data-access/db/insertRow.util', () => ({
  insertRow: vi.fn(async () => [{ order_id: 7 }]),
}));
vi.mock('@repo/data-access/db/selectRows.util', () => ({
  selectRows: vi.fn(async () => [{ order_id: 7 }]),
}));
vi.mock('@repo/data-access/db/updateRows.util', () => ({
  updateRows: vi.fn(async () => [{ order_id: 7 }]),
}));

it('selects one order by its primary key', async () => {
  const order = await selectOrderById(7);

  expect(order).toStrictEqual({ order_id: 7 });
  expect(selectRows).toHaveBeenCalledWith(
    expect.objectContaining({
      filters: [{ column: 'order_id', operator: 'eq', value: 7 }],
      limit: 1,
      schema: 'public',
      table: 'enterprise_orders',
    }),
  );
});

it('returns the max order_id plus one', async () => {
  const next = await getNextOrderId();

  expect(next).toBe(42);
  expect(getMaxValue).toHaveBeenCalledWith(
    expect.objectContaining({ column: 'order_id', table: 'enterprise_orders' }),
  );
});

it('inserts the provided values', async () => {
  await insertOrder({ values: { customer_name: 'Ada', order_id: 7 } });

  expect(insertRow).toHaveBeenCalledWith(
    expect.objectContaining({
      table: 'enterprise_orders',
      values: { customer_name: 'Ada', order_id: 7 },
    }),
  );
});

it('updates by primary key with the provided values', async () => {
  await updateOrder({ orderId: 7, values: { customer_name: 'Grace' } });

  expect(updateRows).toHaveBeenCalledWith(
    expect.objectContaining({
      filters: [{ column: 'order_id', operator: 'eq', value: 7 }],
      values: { customer_name: 'Grace' },
    }),
  );
});

it('deletes by primary key', async () => {
  await deleteOrder(7);

  expect(deleteRows).toHaveBeenCalledWith(
    expect.objectContaining({
      filters: [{ column: 'order_id', operator: 'eq', value: 7 }],
    }),
  );
});
