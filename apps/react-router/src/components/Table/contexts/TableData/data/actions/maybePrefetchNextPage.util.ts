import { firePrefetch } from '@/utils/prefetch/firePrefetch.util';

import type { MaybePrefetchNextPageArgs } from './fetchMoreData.types';

export const maybePrefetchNextPage = <TResponse>({
  enablePrefetch,
  hasMore,
  nextSkip,
  onLoadMore,
  pageSize,
  prefetchRef,
}: MaybePrefetchNextPageArgs<TResponse>) => {
  if (!(enablePrefetch && hasMore)) {
    return;
  }

  firePrefetch({
    limit: pageSize,
    nextSkip,
    onLoadMore,
    prefetchRef,
  });
};
