import type { ActionFunctionArgs } from 'react-router';

import { expect, it, vi } from 'vitest';

import { buildValidOrderFormFields } from '../config/enterpriseOrders.fixtures';
import {
  getNextOrderId,
  insertOrder,
} from '../server/enterpriseOrders.service';
import { action } from './newOrder.action';

vi.mock('../server/enterpriseOrders.service', () => ({
  getNextOrderId: vi.fn(async () => 8),
  insertOrder: vi.fn(async () => ({ order_id: 8 })),
}));

const buildRequest = (fields: Record<string, string>) =>
  new Request('http://localhost/enterprise-orders/new', {
    body: new URLSearchParams(fields),
    method: 'POST',
  });

const authClaims = { exp: 0, iat: 0, jti: 't', sub: 'demo@example.com' };

const run = (fields: Record<string, string>) =>
  action({
    context: { get: () => authClaims },
    request: buildRequest(fields),
  } as unknown as ActionFunctionArgs);

it('assigns the id, derives totals and redirects to the new order view', async () => {
  const result = await run(buildValidOrderFormFields());

  expect(result).toBeInstanceOf(Response);
  const response = result as Response;
  expect(response.status).toBe(302);
  expect(response.headers.get('Location')).toBe('/enterprise-orders/view/8');

  expect(insertOrder).toHaveBeenCalledOnce();
  const values = vi.mocked(insertOrder).mock.calls[0]?.[0].values;
  expect(values?.order_id).toBe(8);
  expect(values?.order_number).toBe('ORD-00000008');
  expect(values?.total_amount).toBe(199.4);
  expect(values?.last_modified_by).toBe('demo@example.com');
});

it('returns field errors and does not persist for an invalid submission', async () => {
  vi.mocked(insertOrder).mockClear();
  vi.mocked(getNextOrderId).mockClear();

  const result = await run({
    ...buildValidOrderFormFields(),
    customer_email: 'nope',
  });

  expect(result).toStrictEqual({
    errors: { customer_email: 'Enter a valid email address.' },
  });
  expect(getNextOrderId).not.toHaveBeenCalled();
  expect(insertOrder).not.toHaveBeenCalled();
});
