import type { PrefetchCache } from '@repo/ui/types/ui.types';

type ResolveFromCacheOrFetchArgs<TResponse> = {
  readonly cache: PrefetchCache<TResponse> | undefined;
  readonly expectedSkip: number;
  readonly fetchFn: () => Promise<TResponse>;
};

/**
 * Resolves a response from the prefetch cache (hit or in-flight)
 * or falls back to a fresh fetch. Pure async function — cache reset
 * is the caller's responsibility.
 */
export const resolveFromCacheOrFetch = async <TResponse>({
  cache,
  expectedSkip,
  fetchFn,
}: ResolveFromCacheOrFetchArgs<TResponse>) => {
  if (cache?.skip === expectedSkip && cache.data) {
    return cache.data;
  }

  if (cache?.skip === expectedSkip && cache.promise) {
    return cache.promise;
  }

  return fetchFn();
};
