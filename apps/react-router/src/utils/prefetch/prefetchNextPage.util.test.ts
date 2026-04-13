import { describe, expect, it, vi } from 'vitest';

import { prefetchNextPage } from './prefetchNextPage.util.ts';

describe('prefetchNextPage', () => {
  it('returns initialCache with the promise and skip, and data undefined', () => {
    const onLoadMore = vi.fn().mockResolvedValue({ items: ['a'] });

    const { initialCache } = prefetchNextPage({
      limit: 50,
      nextSkip: 100,
      onLoadMore,
    });

    expect(initialCache.data).toBeUndefined();
    expect(initialCache.promise).toBeInstanceOf(Promise);
    expect(initialCache.skip).toBe(100);
  });

  it('calls onLoadMore with limit and skip', () => {
    const onLoadMore = vi.fn().mockResolvedValue({ items: [] });

    prefetchNextPage({ limit: 25, nextSkip: 75, onLoadMore });

    expect(onLoadMore).toHaveBeenCalledWith({ limit: 25, skip: 75 });
  });

  it('resolution resolves with data and skip on success', async () => {
    const response = { items: ['a', 'b'] };
    const onLoadMore = vi.fn().mockResolvedValue(response);

    const { resolution } = prefetchNextPage({
      limit: 50,
      nextSkip: 100,
      onLoadMore,
    });

    const result = await resolution;

    expect(result.data).toBe(response);
    expect(result.promise).toBeUndefined();
    expect(result.skip).toBe(100);
  });

  it('resolution resolves with skip=-1 on failure', async () => {
    const onLoadMore = vi.fn().mockRejectedValue(new Error('network error'));

    const { resolution } = prefetchNextPage({
      limit: 50,
      nextSkip: 100,
      onLoadMore,
    });

    const result = await resolution;

    expect(result.data).toBeUndefined();
    expect(result.promise).toBeUndefined();
    expect(result.skip).toBe(-1);
  });

  it('initialCache.promise is the same reference as the onLoadMore return', () => {
    const promise = Promise.resolve({ items: [] });
    const onLoadMore = vi.fn().mockReturnValue(promise);

    const { initialCache } = prefetchNextPage({
      limit: 50,
      nextSkip: 0,
      onLoadMore,
    });

    expect(initialCache.promise).toBe(promise);
  });
});
