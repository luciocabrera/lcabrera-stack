import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveDistinctFilterOptions } from './resolveDistinctFilterOptions.util';

const { fetchDistinctValuesMock, getApiBaseUrlMock } = vi.hoisted(() => ({
  fetchDistinctValuesMock: vi.fn(),
  getApiBaseUrlMock: vi.fn(() => '/api'),
}));

vi.mock('@repo/api/distinct/fetch-distinct-values.util', () => ({
  fetchDistinctValues: fetchDistinctValuesMock,
}));
vi.mock('@repo/api/config/get-api-base-url.util', () => ({
  getApiBaseUrl: getApiBaseUrlMock,
}));

const descriptor = {
  kind: 'distinct',
  params: {
    columnName: 'customer_email',
    schemaName: 'public',
    tableName: 'enterprise_orders',
  },
  transport: 'bff',
} as const;

describe('resolveDistinctFilterOptions', () => {
  beforeEach(() => {
    fetchDistinctValuesMock.mockReset();
    fetchDistinctValuesMock.mockResolvedValue({
      hasMore: true,
      values: ['a@x.com'],
    });
  });

  it('fetches a page through the BFF base with skip mapped to offset', async () => {
    const { onLoadMore } = resolveDistinctFilterOptions(descriptor);

    const page = await onLoadMore({ limit: 50, skip: 100 });

    expect(fetchDistinctValuesMock).toHaveBeenCalledWith({
      baseUrl: '/api/distinct',
      columnName: 'customer_email',
      limit: 50,
      offset: 100,
      schemaName: 'public',
      tableName: 'enterprise_orders',
    });
    expect(page).toEqual({ hasMore: true, values: ['a@x.com'] });
  });

  it('targets the same-origin resource route for the loader transport', async () => {
    const { onLoadMore } = resolveDistinctFilterOptions({
      ...descriptor,
      transport: 'loader',
    });

    await onLoadMore({ limit: 50, skip: 0 });

    expect(fetchDistinctValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: '/_api/filter-options' }),
    );
  });

  it('keeps the hasMore ? Infinity : length total convention', () => {
    const { dataSelector, dataTotalSelector } =
      resolveDistinctFilterOptions(descriptor);

    expect(dataSelector({ hasMore: true, values: ['a'] })).toEqual(['a']);
    expect(dataTotalSelector({ hasMore: true, values: ['a'] })).toBe(Infinity);
    expect(dataTotalSelector({ hasMore: false, values: ['a', 'b'] })).toBe(2);
  });
});
