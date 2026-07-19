import type { LoaderFunctionArgs } from 'react-router';

import { expect, it, vi } from 'vitest';

import { selectOrdersPage } from '@/routes/enterprise-orders/server/enterpriseOrders.service';

import { loader } from './enterprise-orders-paginated.loader';

vi.mock('@/routes/enterprise-orders/server/enterpriseOrders.service', () => ({
  selectOrdersPage: vi.fn(async () => ({
    data: [{ order_id: 1 }],
    hasMore: true,
    total: 5,
  })),
}));

it('translates the query and returns the page as JSON', async () => {
  const response = await loader({
    request: new Request(
      'http://localhost/_api/enterprise-orders/paginated?limit=25&skip=50',
    ),
  } as LoaderFunctionArgs);

  expect(response).toBeInstanceOf(Response);
  expect(await response.json()).toStrictEqual({
    data: [{ order_id: 1 }],
    hasMore: true,
    total: 5,
  });
  expect(selectOrdersPage).toHaveBeenCalledWith(
    expect.objectContaining({ limit: 25, offset: 50 }),
  );
});
