import type { ClientActionFunctionArgs } from 'react-router';

import { expect, it, vi } from 'vite-plus/test';

import { buildValidOrderFormFields } from './config/enterpriseOrders.fixtures';
import { orderClientAction } from './orderClientAction';

const buildArgs = (fields: Record<string, string>) => {
  const request = new Request('http://localhost/enterprise-orders/new', {
    body: new URLSearchParams(fields),
    method: 'POST',
  });
  const serverAction = vi.fn(async () => ({ ok: true }));

  return { request, serverAction };
};

it('does not call serverAction and returns errors for an invalid submission', async () => {
  const { request, serverAction } = buildArgs({
    ...buildValidOrderFormFields(),
    customer_email: 'not-an-email',
  });

  const result = await orderClientAction({
    request,
    serverAction,
  } as unknown as ClientActionFunctionArgs);

  expect(serverAction).not.toHaveBeenCalled();
  expect(result).toStrictEqual({
    errors: { customer_email: 'Enter a valid email address.' },
  });
});

it('calls serverAction for a valid submission and returns its result', async () => {
  const { request, serverAction } = buildArgs(buildValidOrderFormFields());

  const result = await orderClientAction({
    request,
    serverAction,
  } as unknown as ClientActionFunctionArgs);

  expect(serverAction).toHaveBeenCalledOnce();
  expect(result).toStrictEqual({ ok: true });
});
