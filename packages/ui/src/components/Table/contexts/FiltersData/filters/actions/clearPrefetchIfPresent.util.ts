import { clearPrefetchCache } from '#ui/utils/prefetch/clearPrefetchCache.util';

import type { FetchFilterDataActionArgs } from './useFetchFilterData.types';

type ClearPrefetchIfPresentArgs<TResponse> = {
  readonly prefetchRef?: FetchFilterDataActionArgs<
    unknown,
    TResponse
  >['prefetchRef'];
};

export const clearPrefetchIfPresent = <TResponse>({
  prefetchRef,
}: ClearPrefetchIfPresentArgs<TResponse>) => {
  if (!prefetchRef) {
    return;
  }

  clearPrefetchCache({ prefetchRef });
};
