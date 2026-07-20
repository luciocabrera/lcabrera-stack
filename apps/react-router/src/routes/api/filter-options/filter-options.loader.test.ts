import type { LoaderFunctionArgs } from 'react-router';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loader } from './filter-options.loader';

const { fetchDistinctValuesMock } = vi.hoisted(() => ({
  fetchDistinctValuesMock: vi.fn(),
}));

vi.mock('@repo/data-access/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@repo/data-access/api')>()),
  fetchDistinctValues: fetchDistinctValuesMock,
  getApiBaseUrl: vi.fn(() => 'http://localhost:3001/api'),
}));

const invokeLoader = (search: string) =>
  loader({
    request: new Request(`http://localhost/_api/filter-options?${search}`),
  } as LoaderFunctionArgs);

describe('filter-options loader', () => {
  beforeEach(() => {
    fetchDistinctValuesMock.mockReset();
    fetchDistinctValuesMock.mockResolvedValue({
      hasMore: true,
      values: ['Blue'],
    });
  });

  it('proxies validated params to the BFF distinct endpoint and returns JSON', async () => {
    const response = await invokeLoader(
      'schemaName=public&tableName=car_sales&columnName=color&limit=50&offset=100',
    );

    expect(fetchDistinctValuesMock).toHaveBeenCalledWith({
      baseUrl: 'http://localhost:3001/api/distinct',
      columnName: 'color',
      limit: 50,
      offset: 100,
      schemaName: 'public',
      tableName: 'car_sales',
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ hasMore: true, values: ['Blue'] });
  });

  it('answers 400 without calling the BFF when source params are missing', async () => {
    const response = await invokeLoader('columnName=color');

    expect(fetchDistinctValuesMock).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Missing schemaName, tableName, or columnName',
    });
  });
});
