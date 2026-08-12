import { resolveFromCacheOrFetch } from '#ui/utils/prefetch/resolveFromCacheOrFetch.util';

import type { FetchMoreResponseArgs } from './fetchMoreData.types';

export const fetchMoreResponse = async <TData, TResponse>({
  currentDataLength,
  lastRow,
  pageSize,
  prefetchRef,
  requiredOnLoadMore,
}: FetchMoreResponseArgs<TData, TResponse>) => {
  return resolveFromCacheOrFetch({
    cache: prefetchRef.current,
    expectedSkip: currentDataLength,
    fetchFn: () =>
      requiredOnLoadMore({
        lastRow,
        limit: pageSize,
        skip: currentDataLength,
      }),
  });
};
