import type { RefObject } from 'react';

import type { Pagination, PrefetchCache } from '#ui/types/ui.types';

import { prefetchNextPage } from './prefetchNextPage.util';

type FirePrefetchArgs<TResponse, TData = unknown> = {
  readonly lastRow?: TData;
  readonly limit: number;
  readonly nextSkip: number;
  readonly onLoadMore: (params: Pagination<TData>) => Promise<TResponse>;
  readonly prefetchRef: RefObject<PrefetchCache<TResponse>>;
};

/**
 * Fires a prefetch request for the next page and applies the result
 * to the given ref with a staleness check. If the ref's skip has
 * changed by the time the prefetch resolves, the result is discarded.
 */
export const firePrefetch = <TResponse, TData = unknown>({
  lastRow,
  limit,
  nextSkip,
  onLoadMore,
  prefetchRef,
}: FirePrefetchArgs<TResponse, TData>) => {
  const { initialCache, resolution } = prefetchNextPage({
    lastRow,
    limit,
    nextSkip,
    onLoadMore,
  });

  prefetchRef.current = initialCache;

  void resolution.then((resolvedCache) => {
    if (prefetchRef.current.skip === initialCache.skip) {
      prefetchRef.current = resolvedCache;
    }
  });
};
