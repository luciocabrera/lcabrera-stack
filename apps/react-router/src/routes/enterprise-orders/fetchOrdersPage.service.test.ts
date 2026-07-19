import type { ColumnFiltersState } from '@repo/ui/components/Table';

import { afterEach, expect, it, vi } from 'vitest';

import type { EnterpriseOrder } from './config';

import { fetchOrdersPage } from './fetchOrdersPage.service';

afterEach(() => {
  vi.restoreAllMocks();
});

const noFilter = {} as ColumnFiltersState<EnterpriseOrder>;

it('fetches the paginated resource route and returns the parsed page', async () => {
  const page = { data: [], hasMore: false, total: 0 };
  const fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(Response.json(page));

  const result = await fetchOrdersPage({
    filter: noFilter,
    limit: 50,
    skip: 0,
    sorting: [{ columnKey: 'order_id', direction: 'asc' }],
  });

  expect(result).toStrictEqual(page);
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/_api/enterprise-orders/paginated?'),
  );
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('limit=50'));
});

it('throws when the response is not ok', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response('nope', { status: 500, statusText: 'Server Error' }),
  );

  await expect(
    fetchOrdersPage({ filter: noFilter, limit: 50, skip: 0, sorting: [] }),
  ).rejects.toThrow('Failed to load orders');
});
