import type { LoaderFunctionArgs } from 'react-router';

import { expect, it, vi } from 'vite-plus/test';

import { selectOrdersPage } from '@/routes/enterprise-orders/.server/enterpriseOrders.service';

import { loader } from './enterprise-orders-paginated.loader';

vi.mock('@/routes/enterprise-orders/.server/enterpriseOrders.service', () => ({
  selectOrderGroupKeyTruncations: vi.fn(async () => ({})),
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

it('asks for the total only on the first page of a scroll session', async () => {
  vi.mocked(selectOrdersPage).mockClear();

  await loader({
    request: new Request(
      'http://localhost/_api/enterprise-orders/paginated?limit=25&skip=0',
    ),
  } as LoaderFunctionArgs);
  await loader({
    request: new Request(
      'http://localhost/_api/enterprise-orders/paginated?limit=25&skip=25',
    ),
  } as LoaderFunctionArgs);

  expect(selectOrdersPage).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({ includeTotal: true }),
  );
  expect(selectOrdersPage).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({ includeTotal: false }),
  );
});

it('forwards a keyset cursor to the service', async () => {
  vi.mocked(selectOrdersPage).mockClear();

  const cursor = encodeURIComponent(JSON.stringify(['2026-01-04', 4821]));

  await loader({
    request: new Request(
      `http://localhost/_api/enterprise-orders/paginated?limit=25&skip=25&cursor=${cursor}`,
    ),
  } as LoaderFunctionArgs);

  expect(selectOrdersPage).toHaveBeenCalledWith(
    expect.objectContaining({ cursor: ['2026-01-04', 4821] }),
  );
});
