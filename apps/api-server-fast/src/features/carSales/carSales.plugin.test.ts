import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { MAX_CAR_SALES_LIMIT } from 'api-shared';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { EnvConfig } from '../../config/env.schema';

import { createApp } from '../../app/app';

vi.mock('@lcabrera/server/db/select-rows.util', () => ({
  selectRows: vi.fn(),
}));
vi.mock('@lcabrera/server/db/get-rows-count.util', () => ({
  getRowsCount: vi.fn(),
}));

const mockedSelectRows = vi.mocked(selectRows);
const mockedGetRowsCount = vi.mocked(getRowsCount);

const envConfig: EnvConfig = {
  API_PORT: 3001,
  DB_HOST: 'localhost',
  DB_NAME: 'test',
  DB_PASSWORD: 'test',
  DB_PORT: 5432,
  DB_USER: 'test',
  DISTINCT_VALUES_DELAY_MS: 0,
  ENTERPRISE_ORDERS_DELAY_MS: 0,
};

describe('carSales fastify plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a limit above MAX_CAR_SALES_LIMIT with 400', async () => {
    mockedSelectRows.mockResolvedValue([]);
    mockedGetRowsCount.mockResolvedValue(0);

    const app = createApp({ envConfig });

    const response = await app.inject({
      method: 'GET',
      url: `/api/car-sales/paginated?skip=0&limit=${MAX_CAR_SALES_LIMIT + 1}`,
    });

    expect(response.statusCode).toBe(400);
    // The read must never start: a 400 alongside a whole-table query would
    // still have served the request this bound exists to refuse.
    expect(mockedSelectRows).not.toHaveBeenCalled();

    await app.close();
  });

  it('serves a limit exactly at the ceiling', async () => {
    mockedSelectRows.mockResolvedValue([]);
    mockedGetRowsCount.mockResolvedValue(0);

    const app = createApp({ envConfig });

    const response = await app.inject({
      method: 'GET',
      url: `/api/car-sales/paginated?skip=0&limit=${MAX_CAR_SALES_LIMIT}`,
    });

    expect(response.statusCode).toBe(200);
    expect(mockedSelectRows).toHaveBeenCalledWith(
      expect.objectContaining({ limit: MAX_CAR_SALES_LIMIT }),
    );

    await app.close();
  });

  it('serves an ordinary page unchanged', async () => {
    mockedSelectRows.mockResolvedValue([{ car_id: 1 }]);
    mockedGetRowsCount.mockResolvedValue(10);

    const app = createApp({ envConfig });

    const response = await app.inject({
      method: 'GET',
      url: '/api/car-sales/paginated?skip=4&limit=2',
    });

    expect(response.statusCode).toBe(200);
    expect(mockedSelectRows).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 2, offset: 4, table: 'car_sales' }),
    );

    await app.close();
  });
});
