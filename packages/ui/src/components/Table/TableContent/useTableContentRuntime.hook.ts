import { useRef } from 'react';

import type { TableContentProps } from './TableContent.types';

import { useSyncColumnAxisColumns } from '../contexts/TableConfig/grouping/actions';
import {
  useGetTableIsRounded,
  useGetTableThreshold,
} from '../contexts/TableConfig/meta/selectors';
import { useFetchMoreData } from '../contexts/TableData/data/actions';
import {
  useGetTableHasMore,
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '../contexts/TableData/data/selectors';
import { useInfiniteScroll, useScrollResetAfterLoad } from '../hooks';
import { useRetainTablePersistFetchers } from '../TableLayout/useRetainTablePersistFetchers.hook';

type UseTableContentRuntimeArgs<
  TData extends Record<string, unknown>,
  TResponse,
> = Pick<
  TableContentProps<TData, TResponse>,
  'dataSelector' | 'dataTotalSelector' | 'onLoadMore'
>;

export const useTableContentRuntime = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  dataSelector,
  dataTotalSelector,
  onLoadMore,
}: UseTableContentRuntimeArgs<TData, TResponse>) => {
  const threshold = useGetTableThreshold();
  useRetainTablePersistFetchers();
  useSyncColumnAxisColumns();
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();
  const isRounded = useGetTableIsRounded();
  const hasMore = useGetTableHasMore();
  const fetchMoreData = useFetchMoreData<TData, TResponse>();
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useScrollResetAfterLoad({ scrollContainerRef: containerRef });
  useInfiniteScroll({
    dataSelector,
    dataTotalSelector,
    fetchMoreData,
    hasMore,
    isLoadingMore,
    onLoadMore,
    scrollContainerRef: containerRef,
    sentinelRef,
    threshold,
  });

  return { containerRef, isLoading, isRounded, sentinelRef, wrapperRef };
};
