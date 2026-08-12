import type { RefObject } from 'react';

import type { InfiniteScroll } from '#ui/types/ui.types';

import { useInfiniteScrollObserver } from '#ui/hooks';

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
  /** Reference to the scrollable container (IntersectionObserver root) */
  scrollContainerRef: RefObject<HTMLElement | null>;
  /** Reference to the sentinel element rendered at the end of the scrollable content */
  sentinelRef: RefObject<HTMLElement | null>;
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
  sentinelRef,
  threshold,
}: UseInfiniteScrollArgs<TData, TResponse>) => {
  const isEnabled = Boolean(hasMore) && !isLoadingMore && Boolean(onLoadMore);

  const handleReachEnd = () => {
    if (!onLoadMore) return;
    void fetchMoreData({ dataSelector, dataTotalSelector, onLoadMore });
  };

  useInfiniteScrollObserver({
    isEnabled,
    onReachEnd: handleReachEnd,
    rootRef: scrollContainerRef,
    sentinelRef,
    threshold,
  });
};
