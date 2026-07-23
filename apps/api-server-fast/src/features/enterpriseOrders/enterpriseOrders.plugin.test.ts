import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
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

describe('enterpriseOrders fastify plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps a number filter to a generic QueryFilter shared by the page and its count', async () => {
    mockedSelectRows.mockResolvedValue([]);
    mockedGetRowsCount.mockResolvedValue(0);

    const app = createApp({ envConfig });

    const response = await app.inject({
      method: 'GET',
      url: '/api/enterprise-orders/paginated?skip=0&limit=10&filter=%7B%22total_amount%22%3A%7B%22operator%22%3A%22lessThan%22%2C%22type%22%3A%22number%22%2C%22value%22%3A20%7D%7D',
    });

    expect(response.statusCode).toBe(200);
    expect(mockedSelectRows).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [{ column: 'total_amount', operator: 'lt', value: 20 }],
        limit: 10,
        offset: 0,
        schema: 'public',
        table: 'enterprise_orders',
      }),
    );
    expect(mockedGetRowsCount).toHaveBeenCalledWith(
      expect.objectContaining({
        column: 'order_id',
        filters: [{ column: 'total_amount', operator: 'lt', value: 20 }],
        schema: 'public',
        table: 'enterprise_orders',
      }),
    );

    await app.close();
  });
});
