import { selectFilterOptions } from '@lcabrera/server/db/select-filter-options.util';
import { MAX_DISTINCT_LIMIT } from 'api-shared';
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

describe('distinct fastify plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('serves allow-listed distinct values via selectFilterOptions', async () => {
    mockedSelectFilterOptions.mockResolvedValue({
      hasMore: true,
      values: ['Delivered', 'Pending'],
    });

    const app = createApp({ envConfig });

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
    const app = createApp({ envConfig });

    const response = await app.inject({
      method: 'GET',
      url: '/api/distinct?schemaName=public&tableName=users&columnName=password',
    });

    expect(response.statusCode).toBe(400);
    expect(mockedSelectFilterOptions).not.toHaveBeenCalled();

    await app.close();
  });

  it('rejects a limit above MAX_DISTINCT_LIMIT with 400', async () => {
    const app = createApp({ envConfig });

    const response = await app.inject({
      method: 'GET',
      url: `/api/distinct?schemaName=public&tableName=enterprise_orders&columnName=order_status&limit=${MAX_DISTINCT_LIMIT + 1}`,
    });

    expect(response.statusCode).toBe(400);
    expect(mockedSelectFilterOptions).not.toHaveBeenCalled();

    await app.close();
  });

  it('serves a limit exactly at the ceiling', async () => {
    mockedSelectFilterOptions.mockResolvedValue({ hasMore: false, values: [] });

    const app = createApp({ envConfig });

    const response = await app.inject({
      method: 'GET',
      url: `/api/distinct?schemaName=public&tableName=enterprise_orders&columnName=order_status&limit=${MAX_DISTINCT_LIMIT}`,
    });

    expect(response.statusCode).toBe(200);
    expect(mockedSelectFilterOptions).toHaveBeenCalledWith(
      expect.objectContaining({ limit: MAX_DISTINCT_LIMIT }),
    );

    await app.close();
  });

  it('rejects requests missing required source params with 400', async () => {
    const app = createApp({ envConfig });

    const response = await app.inject({
      method: 'GET',
      url: '/api/distinct?columnName=order_status',
    });

    expect(response.statusCode).toBe(400);
    expect(mockedSelectFilterOptions).not.toHaveBeenCalled();

    await app.close();
  });
});
