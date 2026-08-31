import type { RefObject } from 'react';

import { describe, expect, it, vi } from 'vite-plus/test';

import type { PrefetchCache } from '#ui/types/ui.types';

import { firePrefetch } from './firePrefetch.util';

const createPrefetchRef = <TResponse>(
  initial: PrefetchCache<TResponse>,
): RefObject<PrefetchCache<TResponse>> => ({ current: initial });

describe('firePrefetch', () => {
  it('writes initialCache to prefetchRef.current immediately', () => {
    const prefetchRef = createPrefetchRef<string>({
      data: undefined,
      promise: undefined,
      skip: -1,
    });
    const onLoadMore = vi.fn().mockReturnValue(new Promise(() => {}));

    firePrefetch({ limit: 50, nextSkip: 100, onLoadMore, prefetchRef });

    expect(prefetchRef.current.skip).toBe(100);
    expect(prefetchRef.current.data).toBeUndefined();
    expect(prefetchRef.current.promise).toBeInstanceOf(Promise);
  });

  it('calls onLoadMore with the correct limit and skip', () => {
    const prefetchRef = createPrefetchRef<string>({
      data: undefined,
      promise: undefined,
      skip: -1,
    });
    const onLoadMore = vi.fn().mockReturnValue(new Promise(() => {}));

    firePrefetch({ limit: 25, nextSkip: 75, onLoadMore, prefetchRef });

    expect(onLoadMore).toHaveBeenCalledWith({ limit: 25, skip: 75 });
  });

  it('updates prefetchRef with resolved data when skip still matches', async () => {
    const prefetchRef = createPrefetchRef<string>({
      data: undefined,
      promise: undefined,
      skip: -1,
    });
    const onLoadMore = vi.fn().mockResolvedValue('prefetched-data');

    firePrefetch({ limit: 50, nextSkip: 100, onLoadMore, prefetchRef });

    await vi.waitFor(() => {
      expect(prefetchRef.current.data).toBe('prefetched-data');
    });

    expect(prefetchRef.current.promise).toBeUndefined();
    expect(prefetchRef.current.skip).toBe(100);
  });

  it('discards resolved data when skip has changed (stale)', async () => {
    const prefetchRef = createPrefetchRef<string>({
      data: undefined,
      promise: undefined,
      skip: -1,
    });
    const { promise, resolve } = Promise.withResolvers<string>();
    const onLoadMore = vi.fn().mockReturnValue(promise);

    firePrefetch({ limit: 50, nextSkip: 100, onLoadMore, prefetchRef });

    prefetchRef.current = { data: undefined, promise: undefined, skip: 200 };

    resolve('stale-data');
    await promise;

    expect(prefetchRef.current.skip).toBe(200);
    expect(prefetchRef.current.data).toBeUndefined();
  });

  it('resets cache to skip=-1 on prefetch failure when skip still matches', async () => {
    const prefetchRef = createPrefetchRef<string>({
      data: undefined,
      promise: undefined,
      skip: -1,
    });
    const onLoadMore = vi.fn().mockRejectedValue(new Error('fail'));

    firePrefetch({ limit: 50, nextSkip: 100, onLoadMore, prefetchRef });

    await vi.waitFor(() => {
      expect(prefetchRef.current.skip).toBe(-1);
    });

    expect(prefetchRef.current.data).toBeUndefined();
    expect(prefetchRef.current.promise).toBeUndefined();
  });
});
