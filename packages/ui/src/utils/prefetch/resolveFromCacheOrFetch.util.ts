import type { PrefetchCache } from '#ui/types/ui.types';

type ResolveFromCacheOrFetchArgs<TResponse> = {
  readonly cache: PrefetchCache<TResponse> | undefined;
  readonly expectedSkip: number;
  readonly fetchFn: () => Promise<TResponse>;
};

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
