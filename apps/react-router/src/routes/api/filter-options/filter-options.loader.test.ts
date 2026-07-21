import type { LoaderFunctionArgs } from 'react-router';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loader } from './filter-options.loader';

const { fetchDistinctValuesMock } = vi.hoisted(() => ({
  fetchDistinctValuesMock: vi.fn(),
}));

// Only the two transport-touching modules are mocked; parseFilterOptionsParams
// stays real so the loader's validation path is exercised, not stubbed.
vi.mock('@repo/api/distinct/fetch-distinct-values.util', () => ({
  fetchDistinctValues: fetchDistinctValuesMock,
}));
vi.mock('@repo/api/config/get-api-base-url.util', () => ({
  getApiBaseUrl: vi.fn(() => 'http://localhost:3001/api'),
}));

const invokeLoader = (search: string) => {
  const request = new Request(`http://localhost/_api/filter-options?${search}`);

  return {
    request,
    response: loader({ request } as LoaderFunctionArgs),
  };
};

describe('filter-options loader', () => {
  beforeEach(() => {
    fetchDistinctValuesMock.mockReset();
    fetchDistinctValuesMock.mockResolvedValue({
      hasMore: true,
      values: ['Blue'],
    });
  });

  it('proxies validated params to the BFF distinct endpoint and returns JSON', async () => {
    const { request, response: pending } = invokeLoader(
      'schemaName=public&tableName=car_sales&columnName=color&limit=50&offset=100',
    );
    const response = await pending;

    expect(fetchDistinctValuesMock).toHaveBeenCalledWith({
      baseUrl: 'http://localhost:3001/api/distinct',
      columnName: 'color',
      limit: 50,
      offset: 100,
      schemaName: 'public',
      // Forwarded, not fabricated: aborting the client request must cancel the
      // BFF call rather than leave it running for a response nobody reads.
      signal: request.signal,
      tableName: 'car_sales',
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ hasMore: true, values: ['Blue'] });
  });

  it('answers 400 without calling the BFF when source params are missing', async () => {
    const response = await invokeLoader('columnName=color').response;

    expect(fetchDistinctValuesMock).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Missing schemaName, tableName, or columnName',
    });
  });
});
