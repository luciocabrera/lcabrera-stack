import type { AddressInfo } from 'node:net';

import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { selectFilterOptions } from '@lcabrera/server/db/select-filter-options.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import {
  MAX_CAR_SALES_LIMIT,
  MAX_DISTINCT_LIMIT,
  MAX_ENTERPRISE_ORDERS_LIMIT,
  MAX_WIDE_ALLTYPES_LIMIT,
} from 'api-shared';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import type { EnvConfig } from '../config/env.schema';

import { createApp } from './app';

vi.mock('@lcabrera/server/db/select-rows.util', () => ({
  selectRows: vi.fn(),
}));
vi.mock('@lcabrera/server/db/get-rows-count.util', () => ({
  getRowsCount: vi.fn(),
}));
vi.mock('@lcabrera/server/db/select-filter-options.util', () => ({
  selectFilterOptions: vi.fn(),
}));

const mockedSelectRows = vi.mocked(selectRows);
const mockedGetRowsCount = vi.mocked(getRowsCount);
const mockedSelectFilterOptions = vi.mocked(selectFilterOptions);

const envConfig: EnvConfig = {
  API_PORT: 0,
  CORS_ALLOWED_ORIGINS: 'http://localhost:5173',
  DB_HOST: 'localhost',
  DB_NAME: 'test',
  DB_PASSWORD: 'test',
  DB_PORT: 5432,
  DB_USER: 'test',
  DISTINCT_VALUES_DELAY_MS: 0,
  ENTERPRISE_ORDERS_DELAY_MS: 0,
};

/**
 * Drives the page-window bound over a real HTTP connection through the real
 * Express stack — router, middleware and all — rather than by calling a
 * controller directly. Only the `@lcabrera/server` executors are mocked, so
 * everything between the socket and the query layer is the code that ships.
 *
 * The reason this exists alongside the per-controller tests: those construct a
 * handler and hand it a fake `Request`, so a bound lost in routing or in a
 * middleware ordering change would not show up in them.
 *
 * `wideAlltypes150` is here as the **control**. It was already bounded before
 * this suite was written, so it must clamp whether or not the other three do —
 * if every row behaves identically, the probe is measuring something other than
 * the bound.
 */
let baseUrl = '';
let server: ReturnType<ReturnType<typeof createApp>['listen']>;

beforeAll(async () => {
  const app = createApp({ envConfig });

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

beforeEach(() => {
  vi.clearAllMocks();
  mockedSelectRows.mockResolvedValue([]);
  mockedGetRowsCount.mockResolvedValue(0);
  mockedSelectFilterOptions.mockResolvedValue({ hasMore: false, values: [] });
});

const ROW_ROUTES = [
  {
    ceiling: MAX_CAR_SALES_LIMIT,
    name: 'car-sales',
    path: '/api/car-sales/paginated',
  },
  {
    ceiling: MAX_ENTERPRISE_ORDERS_LIMIT,
    name: 'enterprise-orders',
    path: '/api/enterprise-orders/paginated',
  },
  {
    ceiling: MAX_WIDE_ALLTYPES_LIMIT,
    name: 'wide-alltypes-150 (control — bounded before this change)',
    path: '/api/wide-alltypes-150/paginated',
  },
] as const;

describe('page window over real HTTP', () => {
  it.each(ROW_ROUTES)(
    '$name clamps an over-ceiling limit to exactly the ceiling',
    async ({ ceiling, path }) => {
      const response = await fetch(
        `${baseUrl}${path}?skip=0&limit=${ceiling + 1_000_000}`,
      );

      expect(response.status).toBe(200);
      expect(mockedSelectRows).toHaveBeenCalledWith(
        expect.objectContaining({ limit: ceiling }),
      );
    },
  );

  it.each(ROW_ROUTES)(
    '$name serves an ordinary page unchanged',
    async ({ path }) => {
      const response = await fetch(`${baseUrl}${path}?skip=40&limit=20`);

      expect(response.status).toBe(200);
      expect(mockedSelectRows).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20, offset: 40 }),
      );
    },
  );

  it('distinct clamps an over-ceiling limit to exactly the ceiling', async () => {
    const response = await fetch(
      `${baseUrl}/api/distinct?schemaName=public&tableName=enterprise_orders&columnName=order_status&limit=${MAX_DISTINCT_LIMIT + 1_000_000}`,
    );

    expect(response.status).toBe(200);
    expect(mockedSelectFilterOptions).toHaveBeenCalledWith(
      expect.objectContaining({ limit: MAX_DISTINCT_LIMIT }),
    );
  });

  it('distinct serves an ordinary page unchanged', async () => {
    const response = await fetch(
      `${baseUrl}/api/distinct?schemaName=public&tableName=enterprise_orders&columnName=order_status&limit=25&offset=50`,
    );

    expect(response.status).toBe(200);
    expect(mockedSelectFilterOptions).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 25, offset: 50 }),
    );
  });
});
