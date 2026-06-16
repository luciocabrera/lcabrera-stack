import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EnvConfig } from '../../config/env.schema';

import { createApp } from '../../app/app';

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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts number filters for currency-backed columns', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }),
    };

    const app = createApp({
      envConfig,
      pool: pool as never,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/enterprise-orders/paginated?skip=0&limit=10&filter=%7B%22total_amount%22%3A%7B%22operator%22%3A%22lessThan%22%2C%22type%22%3A%22number%22%2C%22value%22%3A20%7D%7D',
    });

    expect(response.statusCode).toBe(200);
    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('total_amount < $1'),
      [20, 10, 0],
    );
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('COUNT(*)'),
      [20],
    );

    await app.close();
  });
});
