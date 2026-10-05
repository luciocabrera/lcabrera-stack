import type { ActionFunctionArgs } from 'react-router';

import { expect, it, vi } from 'vite-plus/test';

import type { EnterpriseOrder } from '../config';

import {
  selectOrderById,
  updateOrder,
} from '../.server/enterpriseOrders.service';
import { buildValidOrderFormFields } from '../config/enterpriseOrders.fixtures';
import { action } from './edit-order.action';

vi.mock('../.server/enterpriseOrders.service', () => ({
  selectOrderById: vi.fn(),
  updateOrder: vi.fn(async () => ({ order_id: 7 })),
}));

const existing = { order_id: 7 } as EnterpriseOrder;

type RunArgs = {
  readonly fields: Record<string, string>;
  readonly orderId: string;
};

const authClaims = { exp: 0, iat: 0, jti: 't', sub: 'demo@example.com' };

const run = ({ fields, orderId }: RunArgs) =>
  action({
    context: { get: () => authClaims },
    params: { orderId },
    request: new Request(`http://localhost/enterprise-orders/edit/${orderId}`, {
      body: new URLSearchParams(fields),
      method: 'POST',
    }),
  } as unknown as ActionFunctionArgs);

it('recomputes totals, updates and redirects to the view', async () => {
  vi.mocked(selectOrderById).mockResolvedValueOnce(existing);

  const result = await run({
    fields: buildValidOrderFormFields(),
    orderId: '7',
  });

  expect(result).toBeInstanceOf(Response);
  expect((result as Response).headers.get('Location')).toBe(
    '/enterprise-orders/view/7',
  );
  const values = vi.mocked(updateOrder).mock.calls[0]?.[0].values;
  expect(values?.total_amount).toBe(199.4);
  expect(values?.last_modified_by).toBe('demo@example.com');
  expect(values).not.toHaveProperty('order_id');
});

it('throws a 404 when the target order is gone', async () => {
  vi.mocked(selectOrderById).mockResolvedValueOnce(undefined);

  await expect(
    run({ fields: buildValidOrderFormFields(), orderId: '7' }),
  ).rejects.toMatchObject({
    init: { status: 404 },
  });
});

it('returns field errors for an invalid submission', async () => {
  vi.mocked(selectOrderById).mockResolvedValueOnce(existing);
  vi.mocked(updateOrder).mockClear();

  const result = await run({
    fields: { ...buildValidOrderFormFields(), quantity: '0' },
    orderId: '7',
  });

  expect(result).toStrictEqual({
    errors: { quantity: 'Quantity must be at least 1.' },
  });
  expect(updateOrder).not.toHaveBeenCalled();
});
