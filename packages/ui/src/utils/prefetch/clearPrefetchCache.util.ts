import type { RefObject } from 'react';

import type { PrefetchCache } from '#ui/types/ui.types';

type ClearPrefetchCacheArgs<TResponse> = {
  readonly prefetchRef:
    | RefObject<PrefetchCache<TResponse>>
    | { current: PrefetchCache<TResponse> };
};

const EMPTY_PREFETCH_CACHE = {
  data: undefined,
  promise: undefined,
  skip: -1,
} as const;

/**
 * Resets a prefetch cache ref to its initial empty state.
 *
 * Accepts both required and optional `RefObject` shapes — when the ref is
 * present the cache is cleared, otherwise this is a no-op.
 */
export const clearPrefetchCache = <TResponse>({
  prefetchRef,
}: ClearPrefetchCacheArgs<TResponse>) => {
  prefetchRef.current = EMPTY_PREFETCH_CACHE as PrefetchCache<TResponse>;
};
