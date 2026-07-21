import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchDistinctValues } from './fetch-distinct-values.util.ts';

const mockFetchResponse = (body: unknown) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(body) as never);

describe('fetchDistinctValues', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('composes the query string with all params and returns the validated body', async () => {
    const fetchSpy = mockFetchResponse({ hasMore: true, values: ['a'] });

    const result = await fetchDistinctValues({
      baseUrl: '/api/distinct',
      columnName: 'customer_email',
      limit: 50,
      offset: 100,
      schemaName: 'public',
      tableName: 'enterprise_orders',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/distinct?columnName=customer_email&limit=50&offset=100&schemaName=public&tableName=enterprise_orders',
    );
    expect(result).toEqual({ hasMore: true, values: ['a'] });
  });

  it('omits schemaName from the query when not provided', async () => {
    const fetchSpy = mockFetchResponse({ hasMore: false, values: [] });

    await fetchDistinctValues({
      baseUrl: '/_api/filter-options',
      columnName: 'color',
      limit: 50,
      offset: 0,
      tableName: 'car_sales',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/_api/filter-options?columnName=color&limit=50&offset=0&tableName=car_sales',
    );
  });

  it('throws on a malformed response body', async () => {
    mockFetchResponse({ values: 'nope' });

    await expect(
      fetchDistinctValues({
        baseUrl: '/api/distinct',
        columnName: 'color',
        limit: 50,
        offset: 0,
        tableName: 'car_sales',
      }),
    ).rejects.toThrow('Invalid distinct values response shape');
  });
});
