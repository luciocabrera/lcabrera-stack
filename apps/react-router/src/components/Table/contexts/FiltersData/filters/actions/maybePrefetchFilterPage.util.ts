import { DEFAULT_FILTER_PAGE_SIZE } from '@/components/Table/Table.constants';
import { firePrefetch } from '@/utils/prefetch/firePrefetch.util';

import type { MaybePrefetchArgs } from './useFetchFilterData.types';

/**
 * Fire a prefetch for the next filter data page when prefetch is enabled,
 * there is more data, and a prefetch ref is available.
 * @param args - Prefetch enablement, paging cursor, loader, and prefetch ref.
 */
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
