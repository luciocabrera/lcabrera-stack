// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vite-plus/test';

import { invokeColumnFilterFetch } from './invokeColumnFilterFetch.util';

describe('invokeColumnFilterFetch', () => {
  it('calls the fetch with the page selectors', async () => {
    const fetchFn = vi.fn(async () => undefined);

    await invokeColumnFilterFetch({
      createFetch: () => fetchFn,
      onLoadMore: async () => ({ rows: ['A'], total: 1 }),
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledWith(
      expect.objectContaining({
        onLoadMore: expect.any(Function),
      }),
    );
  });
});
