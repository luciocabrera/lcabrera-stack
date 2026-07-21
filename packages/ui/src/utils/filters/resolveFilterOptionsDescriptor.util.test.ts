import { describe, expect, it, vi } from 'vitest';

import { resolveFilterOptionsDescriptor } from './resolveFilterOptionsDescriptor.util';

vi.mock('@repo/api/distinct/fetch-distinct-values.util', () => ({
  fetchDistinctValues: vi.fn(),
}));
vi.mock('@repo/api/config/get-api-base-url.util', () => ({
  getApiBaseUrl: vi.fn(() => '/api'),
}));

describe('resolveFilterOptionsDescriptor', () => {
  it('dispatches static descriptors to the client-side slicing executor', async () => {
    const executor = resolveFilterOptionsDescriptor({
      kind: 'static',
      values: ['a', 'b'],
    });

    expect(await executor.onLoadMore({ limit: 1, skip: 0 })).toEqual({
      hasMore: true,
      values: ['a'],
    });
  });

  it('dispatches distinct descriptors to the fetching executor contract', () => {
    const executor = resolveFilterOptionsDescriptor({
      kind: 'distinct',
      params: { columnName: 'color', tableName: 'car_sales' },
      transport: 'loader',
    });

    expect(typeof executor.onLoadMore).toBe('function');
    expect(typeof executor.dataSelector).toBe('function');
    expect(typeof executor.dataTotalSelector).toBe('function');
  });
});
