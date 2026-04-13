import type { RefObject } from 'react';
import type { PrefetchCache } from '@/types/ui.types';

import { describe, expect, it, vi } from 'vitest';

import { firePrefetch } from './firePrefetch.util.ts';

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

    // Wait for the resolution to complete
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
    let resolvePromise: (value: string) => void;
    const promise = new Promise<string>((resolve) => {
      resolvePromise = resolve;
    });
    const onLoadMore = vi.fn().mockReturnValue(promise);

    firePrefetch({ limit: 50, nextSkip: 100, onLoadMore, prefetchRef });

    // Simulate the consumer consuming the cache and firing a new prefetch
    // which changes the skip value
    prefetchRef.current = { data: undefined, promise: undefined, skip: 200 };

    // Now resolve the original prefetch
    resolvePromise!('stale-data');
    await promise;

    // The stale result should be discarded — skip should still be 200
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
