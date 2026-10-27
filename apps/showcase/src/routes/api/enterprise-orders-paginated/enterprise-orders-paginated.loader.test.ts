import type { selectRows } from '@lcabrera/server/db/select-rows.util';
import type { LoaderFunctionArgs } from 'react-router';

import { expect, it, vi } from 'vite-plus/test';

import { loader } from './enterprise-orders-paginated.loader';

const { getRowsCountMock, selectRowsMock } = vi.hoisted(() => ({
  getRowsCountMock: vi.fn(async () => 5),
  selectRowsMock: vi.fn<
    (descriptor: Parameters<typeof selectRows>[0]) => Promise<unknown>
  >(async () => [{ order_id: 1 }]),
}));

vi.mock('@lcabrera/server/db/get-rows-count.util', () => ({
  getRowsCount: getRowsCountMock,
}));
vi.mock('@lcabrera/server/db/select-rows.util', () => ({
  selectRows: selectRowsMock,
}));

const get = async (search: string) =>
  loader({
    request: new Request(
      `http://localhost/_api/enterprise-orders/paginated?${search}`,
    ),
  } as LoaderFunctionArgs);

const firstSelect = () => selectRowsMock.mock.calls[0]?.[0];

it('translates the query and returns the page as JSON', async () => {
  const response = await get('limit=25&skip=50');

  expect(response).toBeInstanceOf(Response);
  expect(await response.json()).toStrictEqual({
    data: [{ order_id: 1 }],
    hasMore: false,
  });
  expect(firstSelect()).toEqual(
    expect.objectContaining({
      limit: 25,
      offset: 50,
      schema: 'public',
      table: 'enterprise_orders',
    }),
  );
});

it('asks for the total only on the first page of a scroll session', async () => {
  await get('limit=25&skip=0');
  await get('limit=25&skip=25');

  expect(getRowsCountMock).toHaveBeenCalledOnce();
});

it('seeks past a keyset cursor', async () => {
  const sort = encodeURIComponent(
    JSON.stringify([{ columnKey: 'order_id', direction: 'asc' }]),
  );
  const cursor = encodeURIComponent(JSON.stringify([4821]));

  await get(`limit=25&skip=25&sort=${sort}&cursor=${cursor}`);

  expect(firstSelect()?.cursor).toStrictEqual({
    uniqueColumn: 'order_id',
    values: [4821],
  });
});
