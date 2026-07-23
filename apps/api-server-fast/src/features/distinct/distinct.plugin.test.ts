import { selectFilterOptions } from '@lcabrera/server/db/select-filter-options.util';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { EnvConfig } from '../../config/env.schema';

import { createApp } from '../../app/app';

vi.mock('@lcabrera/server/db/select-filter-options.util', () => ({
  selectFilterOptions: vi.fn(),
}));

const mockedSelectFilterOptions = vi.mocked(selectFilterOptions);

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

// createApp still wires a pool for the non-distinct features; the distinct path
// no longer touches it (it reads through selectFilterOptions), so a stub is fine.
const stubPool = { query: vi.fn() } as never;

describe('distinct fastify plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('serves allow-listed distinct values via selectFilterOptions', async () => {
    mockedSelectFilterOptions.mockResolvedValue({
      hasMore: true,
      values: ['Delivered', 'Pending'],
    });

    const app = createApp({ envConfig, pool: stubPool });

    const response = await app.inject({
      method: 'GET',
      url: '/api/distinct?schemaName=public&tableName=enterprise_orders&columnName=order_status&limit=2&offset=4',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      hasMore: true,
      values: ['Delivered', 'Pending'],
    });
    expect(mockedSelectFilterOptions).toHaveBeenCalledWith({
      allowedColumns: expect.arrayContaining(['order_status']),
      column: 'order_status',
      columnType: 'text',
      limit: 2,
      offset: 4,
      schema: 'public',
      table: 'enterprise_orders',
    });

    await app.close();
  });

  it('rejects a source outside the allow-list with 400', async () => {
    const app = createApp({ envConfig, pool: stubPool });

    const response = await app.inject({
      method: 'GET',
      url: '/api/distinct?schemaName=public&tableName=users&columnName=password',
    });

    expect(response.statusCode).toBe(400);
    expect(mockedSelectFilterOptions).not.toHaveBeenCalled();

    await app.close();
  });

  it('rejects requests missing required source params with 400', async () => {
    const app = createApp({ envConfig, pool: stubPool });

    const response = await app.inject({
      method: 'GET',
      url: '/api/distinct?columnName=order_status',
    });

    expect(response.statusCode).toBe(400);
    expect(mockedSelectFilterOptions).not.toHaveBeenCalled();

    await app.close();
  });
});
