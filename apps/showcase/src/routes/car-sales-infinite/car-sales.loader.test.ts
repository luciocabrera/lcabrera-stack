import type { LoaderFunctionArgs } from 'react-router';

import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { loader } from './car-sales.loader';

const { readCarSalesPageMock } = vi.hoisted(() => ({
  readCarSalesPageMock: vi.fn(() =>
    Promise.resolve({ data: [], hasMore: false, total: 0 }),
  ),
}));

vi.mock('../car-sales/.server/carSales.service', () => ({
  readCarSalesPage: readCarSalesPageMock,
}));

const invokeLoader = async () =>
  loader({
    request: new Request('http://localhost/car-sales-infinite'),
  } as LoaderFunctionArgs);

beforeEach(() => {
  readCarSalesPageMock.mockClear();
});

describe('car-sales-infinite loader', () => {
  it("reads its first page through the route's own server service", async () => {
    await invokeLoader();

    expect(readCarSalesPageMock).toHaveBeenCalledTimes(1);
    expect(readCarSalesPageMock).toHaveBeenCalledWith(
      expect.objectContaining({ limit: INITIAL_PAGE_SIZE, skip: 0 }),
    );
  });

  it('declares neither keyset nor server filtering — this endpoint supports neither', async () => {
    const { metaState } = await invokeLoader();

    expect(metaState.isKeysetEnabled).toBe(false);
    expect(metaState.isServerFilterEnabled).toBe(false);
  });

  it('carries the primary-key tiebreaker into the sort it asks for', async () => {
    await invokeLoader();

    expect(readCarSalesPageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sorting: [{ columnKey: 'car_id', direction: 'asc' }],
      }),
    );
  });
});
