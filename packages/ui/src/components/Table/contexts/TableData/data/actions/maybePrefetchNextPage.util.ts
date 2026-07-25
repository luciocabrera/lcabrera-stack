import { firePrefetch } from '@lcabrera/ui/utils/prefetch/firePrefetch.util';

import type { MaybePrefetchNextPageArgs } from './fetchMoreData.types';

export const maybePrefetchNextPage = <TData, TResponse>({
  enablePrefetch,
  hasMore,
  lastRow,
  nextSkip,
  onLoadMore,
  pageSize,
  prefetchRef,
}: MaybePrefetchNextPageArgs<TData, TResponse>) => {
  if (!(enablePrefetch && hasMore)) {
    return;
  }

  firePrefetch({
    lastRow,
    limit: pageSize,
    nextSkip,
    onLoadMore,
    prefetchRef,
  });
};
