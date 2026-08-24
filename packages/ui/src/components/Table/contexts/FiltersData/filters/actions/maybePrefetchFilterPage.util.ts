import { DEFAULT_FILTER_PAGE_SIZE } from '#ui/components/Table/Table.constants';
import { firePrefetch } from '#ui/utils/prefetch/firePrefetch.util';

import type { MaybePrefetchArgs } from './useFetchFilterData.types';

export const maybePrefetchFilterPage = <TResponse>({
  enablePrefetch,
  hasMore,
  nextSkip,
  onLoadMore,
  prefetchRef,
}: MaybePrefetchArgs<TResponse>) => {
  if (!(enablePrefetch && hasMore && prefetchRef)) {
    return;
  }

  firePrefetch({
    limit: DEFAULT_FILTER_PAGE_SIZE,
    nextSkip,
    onLoadMore,
    prefetchRef,
  });
};
