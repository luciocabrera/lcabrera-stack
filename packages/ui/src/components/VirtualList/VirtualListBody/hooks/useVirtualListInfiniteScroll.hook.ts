import type { RefObject } from 'react';

import { useInfiniteScrollObserver } from '#ui/hooks';

import { useFetchMore } from '../../contexts/data/actions';
import {
  useGetContentMode,
  useGetHasMore,
  useGetIsLoadingOptions,
} from '../../contexts/data/selectors';
import {
  useGetHasFetchMore,
  useGetListFilterMode,
  useGetSearchTerm,
} from '../../contexts/list/selectors';
import { isClientFilterActive } from '../../utils/isClientFilterActive.util';
import { SCROLL_THRESHOLD } from '../../VirtualList.constants';

export type UseVirtualListInfiniteScrollArgs = {
  readonly rootRef: RefObject<HTMLElement | null>;
  readonly sentinelRef: RefObject<HTMLElement | null>;
};

export const useVirtualListInfiniteScroll = ({
  rootRef,
  sentinelRef,
}: UseVirtualListInfiniteScrollArgs) => {
  const contentMode = useGetContentMode();
  const hasFetchMore = useGetHasFetchMore();
  const hasMore = useGetHasMore();
  const isLoadingOptions = useGetIsLoadingOptions();
  const listFilterMode = useGetListFilterMode();
  const searchTerm = useGetSearchTerm();
  const fetchMore = useFetchMore();

  const shouldFetchToFill = !isClientFilterActive({
    listFilterMode,
    searchTerm,
  });

  const hasListEnd = contentMode === 'list';

  useInfiniteScrollObserver({
    isEnabled: hasListEnd && hasMore && !isLoadingOptions && hasFetchMore,
    onReachEnd: fetchMore,
    rootRef,
    sentinelRef,
    shouldFetchToFill,
    threshold: SCROLL_THRESHOLD,
  });

  return hasListEnd;
};
