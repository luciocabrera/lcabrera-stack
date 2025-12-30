import { useCallback, useEffect, useRef } from 'react';

import type { LoadMoreHandler } from '../TableContext';

import {
  useAppendTableData,
  useHasMore,
  useSetError,
  useSetLoadingMore,
  useTableLoadingMore,
} from '../TableContext';

type UseInfiniteScrollArgs<TData> = {
  /** Whether infinite scroll is enabled */
  isEnabled?: boolean;
  /** Handler to load more data */
  onLoadMore: LoadMoreHandler<TData>;
  /** Reference to the scrollable container */
  scrollContainerRef: React.RefObject<HTMLElement | null>;
  /** Pixels from bottom to trigger load (default: 200) */
  threshold?: number;
};

/**
 * Hook for infinite scroll loading
 *
 * Detects when scroll reaches near bottom and triggers data loading.
 * Integrates with TableContext for loading state and data appending.
 *
 * @example
 * ```tsx
 * useInfiniteScroll({
 *   scrollContainerRef: tableContainerRef,
 *   onLoadMore: async () => {
 *     const response = await fetchMoreData(page);
 *     return {
 *       data: response.items,
 *       hasMore: response.hasNextPage,
 *       totalRows: response.total,
 *     };
 *   },
 *   threshold: 200,
 * });
 * ```
 */
export const useInfiniteScroll = <TData>({
  isEnabled = true,
  onLoadMore,
  scrollContainerRef,
  threshold = 200,
}: UseInfiniteScrollArgs<TData>) => {
  const [isLoadingMore] = useTableLoadingMore();
  const [hasMore] = useHasMore();
  const setLoadingMore = useSetLoadingMore();
  const appendData = useAppendTableData<TData>();
  const setError = useSetError();

  // Ref to prevent multiple simultaneous loads
  const isLoadingRef = useRef(false);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setLoadingMore(true);

    try {
      const result = await onLoadMore();
      appendData(result.data, result.hasMore, result.totalRows);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load more data';
      setError(message);
    } finally {
      isLoadingRef.current = false;
    }
  }, [hasMore, onLoadMore, setLoadingMore, appendData, setError]);

  useEffect(() => {
    if (!isEnabled) return;

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (isLoadingMore || !hasMore) return;

      const { clientHeight, scrollHeight, scrollTop } = scrollContainer;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom <= threshold) {
        void handleLoadMore();
      }
    };

    // eslint-disable-next-line @typescript-eslint/naming-convention -- DOM API property
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [
    isEnabled,
    scrollContainerRef,
    threshold,
    isLoadingMore,
    hasMore,
    handleLoadMore,
  ]);

  return {
    /** Manually trigger load more */
    loadMore: handleLoadMore,
  };
};
