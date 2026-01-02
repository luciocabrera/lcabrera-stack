import { useCallback, useEffect, useRef } from 'react';

import type {
  CursorParams,
  InfiniteScrollResponse,
  OffsetLimitParams,
  PageBasedParams,
  PaginationStrategy,
} from '../Table.types';
import type { PaginationMeta } from '../TableContext/TableContext.types';

import {
  useAppendTableData,
  useHasMore,
  usePaginationMeta,
  useSetError,
  useSetLoadingMore,
  useSetPaginationMeta,
  useTableData,
  useTableLoadingMore,
} from '../TableContext';

type UseInfiniteScrollArgs<TData> = {
  /** Initial page size for first load */
  initialPageSize: number;
  /** Whether infinite scroll is enabled */
  isEnabled?: boolean;
  /** Page size for subsequent loads */
  loadMorePageSize: number;
  /** Handler to load more data with strategy-specific params */
  onLoadMore: (
    params: CursorParams | OffsetLimitParams | PageBasedParams,
  ) => Promise<InfiniteScrollResponse<TData>>;
  /** Reference to the scrollable container */
  scrollContainerRef: React.RefObject<HTMLElement | null>;
  /** Pagination strategy */
  strategy: PaginationStrategy;
  /** Pixels from bottom to trigger load (default: 200) */
  threshold?: number;
};

/**
 * Hook for infinite scroll loading with pagination strategy support
 *
 * Detects when scroll reaches near bottom and triggers data loading.
 * Supports multiple pagination strategies: cursor, offset-limit, page-based.
 * Integrates with TableContext for loading state and data appending.
 *
 * @example
 * ```tsx
 * // Offset-limit strategy
 * useInfiniteScroll({
 *   strategy: 'offset-limit',
 *   initialPageSize: 100,
 *   loadMorePageSize: 50,
 *   scrollContainerRef: tableContainerRef,
 *   onLoadMore: async ({ skip, limit }) => {
 *     const response = await fetchData(skip, limit);
 *     return {
 *       data: response.items,
 *       hasMore: response.hasMore,
 *       totalRows: response.total,
 *     };
 *   },
 * });
 *
 * // Cursor strategy
 * useInfiniteScroll({
 *   strategy: 'cursor',
 *   initialPageSize: 100,
 *   loadMorePageSize: 50,
 *   scrollContainerRef: tableContainerRef,
 *   onLoadMore: async ({ cursor, limit }) => {
 *     const response = await fetchData(cursor, limit);
 *     return {
 *       data: response.items,
 *       hasMore: response.hasMore,
 *       nextCursor: response.nextCursor,
 *       totalRows: response.total,
 *     };
 *   },
 * });
 * ```
 */
export const useInfiniteScroll = <TData>({
  initialPageSize,
  isEnabled = true,
  loadMorePageSize,
  onLoadMore,
  scrollContainerRef,
  strategy,
  threshold = 200,
}: UseInfiniteScrollArgs<TData>) => {
  const [isLoadingMore] = useTableLoadingMore();
  const [hasMore] = useHasMore();
  const [currentData] = useTableData<TData>();
  const [paginationMeta] = usePaginationMeta() as [PaginationMeta, (value: Partial<PaginationMeta>) => void];
  const setLoadingMore = useSetLoadingMore();
  const setPaginationMeta = useSetPaginationMeta();
  const appendData = useAppendTableData<TData>();
  const setError = useSetError();

  // Ref to prevent multiple simultaneous loads
  const isLoadingRef = useRef(false);

  const handleLoadMore = useCallback(async (): Promise<void> => {
    if (isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setLoadingMore(true);

    try {
      // Calculate pagination parameters based on strategy
      const isInitialLoad = currentData.length === 0;
      const pageSize = isInitialLoad ? initialPageSize : loadMorePageSize;
      
      let params: CursorParams | OffsetLimitParams | PageBasedParams;
      
      switch (strategy) {
        case 'cursor': {
          params = {
            cursor: paginationMeta.cursor ?? '',
            limit: pageSize,
          } satisfies CursorParams;
          break;
        }

        case 'offset-limit': {
          params = {
            limit: pageSize,
            skip: paginationMeta.offset ?? 0,
          } satisfies OffsetLimitParams;
          break;
        }

        case 'page-based': {
          params = {
            page: paginationMeta.page ?? 1,
            pageSize,
          } satisfies PageBasedParams;
          break;
        }

        default: {
          const exhaustiveCheck: never = strategy;
          throw new Error(`Unknown pagination strategy: ${String(exhaustiveCheck)}`);
        }
      }

      const result: InfiniteScrollResponse<TData> = await onLoadMore(params);

      appendData(result.data, result.hasMore, result.totalRows);
      
      // Update pagination metadata after successful load
      switch (strategy) {
        case 'cursor': {
          if (result.nextCursor !== undefined) {
            setPaginationMeta({ cursor: result.nextCursor });
          }
          break;
        }

        case 'offset-limit': {
          const currentOffset = paginationMeta.offset ?? 0;
          setPaginationMeta({ offset: currentOffset + result.data.length });
          break;
        }

        case 'page-based': {
          const currentPage = paginationMeta.page ?? 1;
          setPaginationMeta({ page: currentPage + 1 });
          break;
        }

        default: {
          break;
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load more data';
      setError(message);
    } finally {
      isLoadingRef.current = false;
    }
  }, [
    hasMore,
    strategy,
    paginationMeta,
    currentData.length,
    initialPageSize,
    loadMorePageSize,
    onLoadMore,
    setLoadingMore,
    appendData,
    setPaginationMeta,
    setError,
  ]);

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
