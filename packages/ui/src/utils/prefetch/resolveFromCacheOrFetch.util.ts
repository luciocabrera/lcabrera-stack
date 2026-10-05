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

  return cache?.skip === expectedSkip && cache.promise
    ? cache.promise
    : fetchFn();
};
