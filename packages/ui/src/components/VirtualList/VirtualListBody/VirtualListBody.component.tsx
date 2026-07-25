import { useInfiniteScrollObserver } from '@lcabrera/ui/hooks';
import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import { useFetchMore } from '../contexts/data/actions';
import {
  useGetContentMode,
  useGetHasMore,
  useGetIsLoadingOptions,
} from '../contexts/data/selectors';
import {
  useGetHasFetchMore,
  useGetListFilterMode,
  useGetListMaxHeight,
  useGetSearchTerm,
  useGetShouldFillHeight,
} from '../contexts/list/selectors';
import { isClientFilterActive } from '../utils/isClientFilterActive.util';
import { SCROLL_THRESHOLD } from '../VirtualList.constants';
import { styles } from './VirtualListBody.stylex';
import { VirtualListBodyChildren } from './VirtualListBodyChildren/VirtualListBodyChildren.component';

/**
 * Owns the scroll container and the infinite-scroll sentinel (Table analog:
 * TableContent). Fully self-connected (zero props) — layout config comes
 * from the config store. Content-mode dispatch and virtualization live one
 * level down in VirtualListBodyChildren.
 */
export const VirtualListBody = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const contentMode = useGetContentMode();
  const hasFetchMore = useGetHasFetchMore();
  const hasMore = useGetHasMore();
  const isLoadingOptions = useGetIsLoadingOptions();
  const listFilterMode = useGetListFilterMode();
  const listMaxHeight = useGetListMaxHeight();
  const searchTerm = useGetSearchTerm();
  const shouldFillHeight = useGetShouldFillHeight();
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
    rootRef: scrollContainerRef,
    sentinelRef,
    shouldFetchToFill,
    threshold: SCROLL_THRESHOLD,
  });

  return (
    <div
      {...stylex.props(
        styles.optionsList,
        shouldFillHeight ? styles.optionsListFill : undefined,
      )}
    >
      <div
        ref={scrollContainerRef}
        {...stylex.props(
          shouldFillHeight
            ? styles.virtualContainerFill
            : styles.virtualContainer(listMaxHeight),
        )}
      >
        <VirtualListBodyChildren scrollContainerRef={scrollContainerRef} />

        {hasListEnd && (
          <div
            aria-hidden
            data-testid='virtual-list-sentinel'
            ref={sentinelRef}
            {...stylex.props(styles.sentinel)}
          />
        )}
      </div>
    </div>
  );
};
