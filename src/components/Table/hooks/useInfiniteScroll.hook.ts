import { useEffect } from 'react';

import { useGetTableIsLoadingMore } from '@/components/Table/TableContext/hooks/store/data/selectors';

import type { InfiniteScrollResponse, PaginationState } from '../Table.types';

import { useFetchMoreData } from '../TableContext/hooks/store/data/actions';
import { useGetTableHasMore } from '../TableContext/hooks/store/data/selectors';

type UseInfiniteScrollArgs<TData> = {
  /** Handler to load more data with strategy-specific params */
  onLoadMore?: (
    params: PaginationState,
  ) => Promise<InfiniteScrollResponse<TData>>;
  /** Reference to the scrollable container */
  scrollContainerRef: React.RefObject<HTMLElement | null>;
  /** Pixels from bottom to trigger  */
  threshold: number;
};

export const useInfiniteScroll = <TData>({
  onLoadMore,
  scrollContainerRef,
  threshold,
}: UseInfiniteScrollArgs<TData>) => {
  const isLoadingMore = useGetTableIsLoadingMore();
  const hasMore = useGetTableHasMore();

  const fetchMoreData = useFetchMoreData<TData>();

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (isLoadingMore || !hasMore) return;

      const { clientHeight, scrollHeight, scrollTop } = scrollContainer;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom <= threshold && onLoadMore) {
        void fetchMoreData({ onLoadMore });
      }
    };

    // eslint-disable-next-line @typescript-eslint/naming-convention -- DOM API property
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [
    scrollContainerRef,
    threshold,
    isLoadingMore,
    hasMore,
    fetchMoreData,
    onLoadMore,
  ]);
};
