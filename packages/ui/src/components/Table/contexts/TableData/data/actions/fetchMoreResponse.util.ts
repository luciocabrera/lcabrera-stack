import { resolveFromCacheOrFetch } from '@repo/ui/utils/prefetch/resolveFromCacheOrFetch.util';

import type { FetchMoreResponseArgs } from './fetchMoreData.types';

export const fetchMoreResponse = async <TResponse>({
  currentDataLength,
  pageSize,
  prefetchRef,
  requiredOnLoadMore,
}: FetchMoreResponseArgs<TResponse>) => {
  return resolveFromCacheOrFetch({
    cache: prefetchRef.current,
    expectedSkip: currentDataLength,
    fetchFn: () =>
      requiredOnLoadMore({
        limit: pageSize,
        skip: currentDataLength,
      }),
  });
};
