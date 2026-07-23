import { deleteRows } from '@lcabrera/server/db/delete-rows.util';
import { getMaxValue } from '@lcabrera/server/db/get-max-value.util';
import { insertRow } from '@lcabrera/server/db/insert-row.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { updateRows } from '@lcabrera/server/db/update-rows.util';
import { expect, it, vi } from 'vite-plus/test';

import {
  deleteOrder,
  getNextOrderId,
  insertOrder,
  selectOrderById,
  selectOrdersPage,
  updateOrder,
} from './enterpriseOrders.service';

vi.mock('@lcabrera/server/db/get-pool.util', () => ({
  getPool: vi.fn(() => ({
    query: vi.fn(async () => ({ rows: [{ count: 42 }] })),
  })),
}));
vi.mock('@lcabrera/server/db/delete-rows.util', () => ({
  deleteRows: vi.fn(async () => []),
}));
vi.mock('@lcabrera/server/db/get-max-value.util', () => ({
  getMaxValue: vi.fn(async () => 41),
}));
vi.mock('@lcabrera/server/db/insert-row.util', () => ({
  insertRow: vi.fn(async () => [{ order_id: 7 }]),
}));
vi.mock('@lcabrera/server/db/select-rows.util', () => ({
  selectRows: vi.fn(async () => [{ order_id: 7 }]),
}));
vi.mock('@lcabrera/server/db/update-rows.util', () => ({
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

it('returns a page with total and hasMore from the count query', async () => {
  const page = await selectOrdersPage({
    filters: [],
    limit: 10,
    offset: 0,
    sort: [],
  });

  expect(page.data).toStrictEqual([{ order_id: 7 }]);
  expect(page.total).toBe(42);
  expect(page.hasMore).toBe(true);
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
