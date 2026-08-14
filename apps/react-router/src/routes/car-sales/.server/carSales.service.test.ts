import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { fetchCarSalesPage } from '@/services';

import {
  CAR_SALES_COLUMNS,
  CAR_SALES_SCHEMA,
  CAR_SALES_TABLE,
} from '../config';
import { readCarSalesPage, selectCarSalesPage } from './carSales.service';

vi.mock('@lcabrera/server/db/get-rows-count.util', () => ({
  getRowsCount: vi.fn(async () => 500_000),
}));
vi.mock('@lcabrera/server/db/select-rows.util', () => ({
  selectRows: vi.fn(async () => [
    {
      car_id: 1,
      date_of_ingress: new Date('2020-01-01T23:00:00.000Z'),
      date_of_sale: new Date('2020-01-03T23:00:00.000Z'),
      insurance_expiration_date: new Date('2025-01-01T23:00:00.000Z'),
      model: 'Model 2',
    },
  ]),
}));
vi.mock('@/services', () => ({
  fetchCarSalesPage: vi.fn(async () => ({
    data: [],
    hasMore: false,
    total: 0,
  })),
}));

beforeEach(() => {
  vi.mocked(selectRows).mockClear();
  vi.mocked(getRowsCount).mockClear();
  vi.mocked(fetchCarSalesPage).mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('selectCarSalesPage', () => {
  it('reads the whole projection from public.car_sales, bounded by the window', async () => {
    await selectCarSalesPage({ limit: 25, offset: 50, sorting: [] });

    expect(selectRows).toHaveBeenCalledWith(
      expect.objectContaining({
        allowedColumns: CAR_SALES_COLUMNS,
        fields: CAR_SALES_COLUMNS,
        limit: 25,
        offset: 50,
        schema: CAR_SALES_SCHEMA,
        table: CAR_SALES_TABLE,
      }),
    );
  });

  it('orders by the request`s sort when it has one', async () => {
    await selectCarSalesPage({
      limit: 10,
      offset: 0,
      sorting: [{ columnKey: 'model', direction: 'desc' }],
    });

    expect(vi.mocked(selectRows).mock.calls.at(0)?.at(0)?.sort).toStrictEqual([
      { column: 'model', direction: 'desc' },
    ]);
  });

  it('orders by the primary key when the request carries no sort', async () => {
    // A paginated read with no ORDER BY repeats and skips rows as the planner
    // changes plans between requests, and this endpoint is a public URL.
    await selectCarSalesPage({ limit: 10, offset: 0, sorting: [] });

    expect(vi.mocked(selectRows).mock.calls.at(0)?.at(0)?.sort).toStrictEqual([
      { column: 'car_id', direction: 'asc' },
    ]);
  });

  it('counts the primary key on every page, not only the first', async () => {
    await selectCarSalesPage({ limit: 10, offset: 4990, sorting: [] });

    expect(getRowsCount).toHaveBeenCalledWith(
      expect.objectContaining({ column: 'car_id', table: CAR_SALES_TABLE }),
    );
  });

  it('answers `{ data, hasMore, total }` with date columns already JSON-rendered', async () => {
    const page = await selectCarSalesPage({
      limit: 10,
      offset: 0,
      sorting: [],
    });

    expect(
      Object.keys(page).toSorted((a, b) => a.localeCompare(b)),
    ).toStrictEqual(['data', 'hasMore', 'total']);
    expect(page.total).toBe(500_000);
    expect(page.data.at(0)?.date_of_sale).toBe('2020-01-03T23:00:00.000Z');
  });

  it('reports the end of the set when the window reaches the total', async () => {
    vi.mocked(getRowsCount).mockResolvedValueOnce(1);

    const page = await selectCarSalesPage({
      limit: 10,
      offset: 0,
      sorting: [],
    });

    expect(page.hasMore).toBe(false);
  });

  it('reports more rows when the window ends short of the total', async () => {
    const page = await selectCarSalesPage({
      limit: 1,
      offset: 0,
      sorting: [],
    });

    expect(page.hasMore).toBe(true);
  });
});

describe('readCarSalesPage', () => {
  it('reads Postgres when no external API is configured', async () => {
    vi.stubEnv('VITE_API_URL', undefined);

    await readCarSalesPage({
      limit: 10,
      requestUrl: 'http://localhost:5173/car-sales',
      skip: 0,
      sorting: [{ columnKey: 'model', direction: 'desc' }],
    });

    expect(selectRows).toHaveBeenCalledTimes(1);
    expect(fetchCarSalesPage).not.toHaveBeenCalled();
  });

  it('drops a sort entry with no direction before it reaches the query', async () => {
    vi.stubEnv('VITE_API_URL', undefined);

    await readCarSalesPage({
      limit: 10,
      requestUrl: 'http://localhost:5173/car-sales',
      skip: 0,
      sorting: [
        { columnKey: 'model' },
        { columnKey: 'car_id', direction: 'asc' },
      ],
    });

    expect(vi.mocked(selectRows).mock.calls.at(0)?.at(0)?.sort).toStrictEqual([
      { column: 'car_id', direction: 'asc' },
    ]);
  });

  it('fetches the external API when VITE_API_URL is set, and never touches the pool', async () => {
    vi.stubEnv('VITE_API_URL', 'http://api.test/api');

    await readCarSalesPage({
      limit: 10,
      requestUrl: 'http://localhost:5173/car-sales',
      skip: 20,
      sorting: [],
    });

    expect(fetchCarSalesPage).toHaveBeenCalledWith({
      limit: 10,
      requestUrl: 'http://localhost:5173/car-sales',
      skip: 20,
      sorting: [],
    });
    expect(selectRows).not.toHaveBeenCalled();
  });
});
