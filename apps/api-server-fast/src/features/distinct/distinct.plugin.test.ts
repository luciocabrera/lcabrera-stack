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

describe('distinct fastify plugin', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serves allow-listed distinct values with pagination', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({
        rows: [{ value: 'Delivered' }, { value: 'Pending' }],
      }),
    };

    const app = createApp({ envConfig, pool: pool as never });

    const response = await app.inject({
      method: 'GET',
      url: '/api/distinct?schemaName=public&tableName=enterprise_orders&columnName=order_status&limit=2&offset=4',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      hasMore: true,
      values: ['Delivered', 'Pending'],
    });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT DISTINCT "order_status" AS value'),
      [2, 4],
    );

    await app.close();
  });

  it('rejects a source outside the allow-list with 400', async () => {
    const pool = { query: vi.fn() };

    const app = createApp({ envConfig, pool: pool as never });

    const response = await app.inject({
      method: 'GET',
      url: '/api/distinct?schemaName=public&tableName=users&columnName=password',
    });

    expect(response.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();

    await app.close();
  });

  it('rejects requests missing required source params with 400', async () => {
    const pool = { query: vi.fn() };

    const app = createApp({ envConfig, pool: pool as never });

    const response = await app.inject({
      method: 'GET',
      url: '/api/distinct?columnName=order_status',
    });

    expect(response.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();

    await app.close();
  });
});
