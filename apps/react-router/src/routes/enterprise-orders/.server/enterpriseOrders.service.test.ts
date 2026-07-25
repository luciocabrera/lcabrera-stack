import { deleteRows } from '@lcabrera/server/db/delete-rows.util';
import { getMaxValue } from '@lcabrera/server/db/get-max-value.util';
import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { insertRow } from '@lcabrera/server/db/insert-row.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { updateRows } from '@lcabrera/server/db/update-rows.util';
import { beforeEach, expect, it, vi } from 'vite-plus/test';

import { ENTERPRISE_ORDER_LIST_COLUMNS } from '../config';
import {
  deleteOrder,
  getNextOrderId,
  insertOrder,
  selectOrderById,
  selectOrdersPage,
  updateOrder,
} from './enterpriseOrders.service';

vi.mock('@lcabrera/server/db/delete-rows.util', () => ({
  deleteRows: vi.fn(async () => []),
}));
vi.mock('@lcabrera/server/db/get-max-value.util', () => ({
  getMaxValue: vi.fn(async () => 41),
}));
vi.mock('@lcabrera/server/db/get-rows-count.util', () => ({
  getRowsCount: vi.fn(async () => 42),
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

beforeEach(() => {
  vi.mocked(selectRows).mockClear();
  vi.mocked(getRowsCount).mockClear();
});

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
    includeTotal: true,
    limit: 10,
    offset: 0,
    sort: [],
  });

  expect(page.data).toStrictEqual([{ order_id: 7 }]);
  expect(page.total).toBe(42);
  expect(page.hasMore).toBe(true);
});

it('projects the list read model, not every column of the row', async () => {
  await selectOrdersPage({
    filters: [],
    includeTotal: true,
    limit: 10,
    offset: 0,
    sort: [],
  });

  const [descriptor] = vi.mocked(selectRows).mock.calls[0] ?? [];

  expect(descriptor?.fields).toStrictEqual(ENTERPRISE_ORDER_LIST_COLUMNS);
});

it('skips the count on a load-more page and reports no total', async () => {
  const page = await selectOrdersPage({
    filters: [],
    includeTotal: false,
    limit: 10,
    offset: 50,
    sort: [],
  });

  expect(getRowsCount).not.toHaveBeenCalled();
  expect(page.total).toBeUndefined();
});

it('reports the end of the set when a page comes back short of its limit', async () => {
  const page = await selectOrdersPage({
    filters: [],
    includeTotal: false,
    limit: 10,
    offset: 50,
    sort: [],
  });

  // The mock returns one row for a limit of ten.
  expect(page.hasMore).toBe(false);
});

it('seeks past a keyset cursor instead of applying an offset', async () => {
  await selectOrdersPage({
    cursor: [4821],
    filters: [],
    includeTotal: false,
    limit: 10,
    offset: 50,
    sort: [{ column: 'order_id', direction: 'asc' }],
  });

  const [descriptor] = vi.mocked(selectRows).mock.calls[0] ?? [];

  expect(descriptor?.cursor).toStrictEqual({
    uniqueColumn: 'order_id',
    values: [4821],
  });
  expect(descriptor?.offset).toBeUndefined();
});

it('falls back to the offset when the sort is not a total order', async () => {
  await selectOrdersPage({
    cursor: [4821, 'Acme'],
    filters: [],
    includeTotal: false,
    limit: 10,
    offset: 50,
    sort: [
      { column: 'order_id', direction: 'asc' },
      { column: 'customer_name', direction: 'asc' },
    ],
  });

  const [descriptor] = vi.mocked(selectRows).mock.calls[0] ?? [];

  expect(descriptor?.cursor).toBeUndefined();
  expect(descriptor?.offset).toBe(50);
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
