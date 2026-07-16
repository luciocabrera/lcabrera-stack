import { useInfiniteScrollObserver } from '@repo/ui/hooks';
import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import { useFetchMore } from '../contexts/data/actions';
import {
  useGetHasMore,
  useGetIsLoadingOptions,
} from '../contexts/data/selectors';
import {
  useGetHasFetchMore,
  useGetListMaxHeight,
  useGetShouldFillHeight,
} from '../contexts/list/selectors';
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

  const hasFetchMore = useGetHasFetchMore();
  const hasMore = useGetHasMore();
  const isLoadingOptions = useGetIsLoadingOptions();
  const listMaxHeight = useGetListMaxHeight();
  const shouldFillHeight = useGetShouldFillHeight();
  const fetchMore = useFetchMore();

  useInfiniteScrollObserver({
    isEnabled: hasMore && !isLoadingOptions && hasFetchMore,
    onReachEnd: fetchMore,
    rootRef: scrollContainerRef,
    sentinelRef,
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

        <div aria-hidden ref={sentinelRef} {...stylex.props(styles.sentinel)} />
      </div>
    </div>
  );
};
