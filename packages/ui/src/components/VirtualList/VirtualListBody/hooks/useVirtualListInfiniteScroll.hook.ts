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

/** @returns `hasListEnd` — whether the caller should render the sentinel at all. */
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

  // While a client-side filter narrows the loaded options, the visible list is
  // a subset — so only fetch when the user reaches a real overflow bottom, never
  // to fill a short/empty filtered view (which would scan the whole dataset).
  const shouldFetchToFill = !isClientFilterActive({
    listFilterMode,
    searchTerm,
  });

  // The sentinel marks the end of the rendered options, so it exists only once
  // there are options to reach the end of. In the 'empty' and 'loading' modes it
  // would be the sole in-flow child of the scroll container, contributing its own
  // height to `scrollHeight` — a phantom overflow that paints a scrollbar over
  // "No options found" and satisfies the observer's overflow test as a genuine
  // scrolled-to-bottom, fetching page after page for a filter that can never
  // match one. Bootstrapping the first page is `onFetchInitial`'s job, not the
  // sentinel's.
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
