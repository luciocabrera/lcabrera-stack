import { clearPrefetchCache } from '@repo/ui/utils/prefetch/clearPrefetchCache.util';

import type { FetchFilterDataActionArgs } from './useFetchFilterData.types';

type ClearPrefetchIfPresentArgs<TResponse> = {
  readonly prefetchRef?: FetchFilterDataActionArgs<
    unknown,
    TResponse
  >['prefetchRef'];
};

/**
 * Resets the prefetch cache when a prefetch ref is provided; no-op when the
 * consumer opted out of prefetching and no ref exists.
 * @param args - Optional prefetch cache ref.
 */
export const clearPrefetchIfPresent = <TResponse>({
  prefetchRef,
}: ClearPrefetchIfPresentArgs<TResponse>) => {
  if (!prefetchRef) {
    return;
  }

  clearPrefetchCache({ prefetchRef });
};
