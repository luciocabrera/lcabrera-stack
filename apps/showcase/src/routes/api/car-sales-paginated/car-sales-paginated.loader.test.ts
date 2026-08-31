import type { LoaderFunctionArgs } from 'react-router';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { selectCarSalesPage } from '@/routes/car-sales/.server/carSales.service';

import { loader } from './car-sales-paginated.loader';

vi.mock('@/routes/car-sales/.server/carSales.service', () => ({
  selectCarSalesPage: vi.fn(async () => ({
    data: [{ car_id: 1, date_of_sale: '2020-01-03T23:00:00.000Z' }],
    hasMore: true,
    total: 500_000,
  })),
}));

const invokeLoader = (query: string) =>
  loader({
    request: new Request(`http://localhost/_api/car-sales/paginated?${query}`),
  } as LoaderFunctionArgs);

beforeEach(() => {
  vi.mocked(selectCarSalesPage).mockClear();
});

describe('car-sales paginated resource route', () => {
  it("turns the search params into the service's window and sort", async () => {
    await invokeLoader(
      'limit=25&skip=50&sort=[{"columnKey":"model","direction":"desc"}]',
    );

    expect(selectCarSalesPage).toHaveBeenCalledWith({
      limit: 25,
      offset: 50,
      sorting: [{ columnKey: 'model', direction: 'desc' }],
    });
  });

  it('answers raw JSON, not the single-fetch protocol', async () => {
    const response = await invokeLoader('limit=1&skip=0');

    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toStrictEqual({
      data: [{ car_id: 1, date_of_sale: '2020-01-03T23:00:00.000Z' }],
      hasMore: true,
      total: 500_000,
    });
  });

  it('carries `total` on a page that is not the first', async () => {
    const response = await invokeLoader('limit=25&skip=475');

    expect(
      Object.keys((await response.json()) as object).toSorted((a, b) =>
        a.localeCompare(b),
      ),
    ).toContain('total');
  });
});
