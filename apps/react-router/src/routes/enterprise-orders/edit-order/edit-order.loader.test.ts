import type { LoaderFunctionArgs } from 'react-router';

import { expect, it, vi } from 'vitest';

import type { EnterpriseOrder } from '../config';

import { selectOrderById } from '../.server/enterpriseOrders.service';
import { loader } from './edit-order.loader';

vi.mock('../.server/enterpriseOrders.service', () => ({
  selectOrderById: vi.fn(),
}));

const run = (orderId: string | undefined) =>
  loader({ params: { orderId } } as unknown as LoaderFunctionArgs);

it('returns the loaded order for a valid id', async () => {
  const order = {
    order_id: 7,
    order_number: 'ORD-00000007',
  } as EnterpriseOrder;
  vi.mocked(selectOrderById).mockResolvedValueOnce(order);

  const result = await run('7');

  expect(result).toStrictEqual({ order });
  expect(selectOrderById).toHaveBeenCalledWith(7);
});

it('throws a 404 when the order does not exist', async () => {
  vi.mocked(selectOrderById).mockResolvedValueOnce(undefined);

  await expect(run('999')).rejects.toMatchObject({ init: { status: 404 } });
});

it('throws for an invalid id param', async () => {
  await expect(run('abc')).rejects.toBeDefined();
});
