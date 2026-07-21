import type { Pagination, PrefetchCache } from '@lcabrera/ui/types/ui.types';
import type { RefObject } from 'react';

import { prefetchNextPage } from './prefetchNextPage.util';

type FirePrefetchArgs<TResponse> = {
  readonly limit: number;
  readonly nextSkip: number;
  readonly onLoadMore: (params: Pagination) => Promise<TResponse>;
  readonly prefetchRef: RefObject<PrefetchCache<TResponse>>;
};

/**
 * Fires a prefetch request for the next page and applies the result
 * to the given ref with a staleness check. If the ref's skip has
 * changed by the time the prefetch resolves, the result is discarded.
 */
export const firePrefetch = <TResponse>({
  limit,
  nextSkip,
  onLoadMore,
  prefetchRef,
}: FirePrefetchArgs<TResponse>) => {
  const { initialCache, resolution } = prefetchNextPage({
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
