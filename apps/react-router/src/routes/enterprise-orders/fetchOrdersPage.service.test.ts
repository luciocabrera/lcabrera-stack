import type { ColumnFiltersState } from '@lcabrera/ui/components/Table';

import { afterEach, expect, it, vi } from 'vite-plus/test';

import type { EnterpriseOrderListRow } from './config';

import { fetchOrdersPage } from './fetchOrdersPage.service';

afterEach(() => {
  vi.restoreAllMocks();
});

const noFilter = {} as ColumnFiltersState<EnterpriseOrderListRow>;

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

it('sends the keyset cursor alongside skip', async () => {
  const fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(Response.json({ data: [], hasMore: false }));

  await fetchOrdersPage({
    cursor: [4821],
    filter: noFilter,
    limit: 50,
    skip: 200,
    sorting: [{ columnKey: 'order_id', direction: 'asc' }],
  });

  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining(`cursor=${encodeURIComponent('[4821]')}`),
  );
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('skip=200'));
});
