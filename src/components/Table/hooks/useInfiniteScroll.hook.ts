import { useEffect } from 'react';

import type { InfiniteScroll } from '@/types/ui.types';

type UseInfiniteScrollArgs<TData, TResponse> = InfiniteScroll<
  TData,
  TResponse
> & {
  fetchMoreData: ({
    dataSelector,
    dataTotalSelector,
    onLoadMore,
  }: Omit<
    InfiniteScroll<TData, TResponse>,
    'hasMore' | 'isLoadingMore'
  >) => Promise<void>;
  /** Reference to the scrollable container */
  scrollContainerRef: React.RefObject<HTMLElement | null>;
  /** Pixels from bottom to trigger  */
  threshold: number;
};

export const useInfiniteScroll = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  dataSelector,
  dataTotalSelector,
  fetchMoreData,
  hasMore,
  isLoadingMore,
  onLoadMore,
  scrollContainerRef,
  threshold,
}: UseInfiniteScrollArgs<TData, TResponse>) => {
  // const fetchMoreData = useFetchMoreData<TData, TResponse>();

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (isLoadingMore || !hasMore) return;

      const { clientHeight, scrollHeight, scrollTop } = scrollContainer;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom <= threshold && onLoadMore) {
        void fetchMoreData({ dataSelector, dataTotalSelector, onLoadMore });
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
    dataSelector,
    dataTotalSelector,
  ]);
};
