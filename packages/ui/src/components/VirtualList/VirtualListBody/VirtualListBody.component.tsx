import { useInfiniteScrollObserver } from '@repo/ui/hooks';
import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import type { VirtualListBodyProps } from './VirtualListBody.types';

import { useGetHasFetchMore } from '../contexts/VirtualListConfig/config/selectors';
import { useFetchMore } from '../contexts/VirtualListData/data/actions';
import {
  useGetHasMore,
  useGetIsLoadingOptions,
} from '../contexts/VirtualListData/data/selectors';
import { SCROLL_THRESHOLD } from '../VirtualList.constants';
import { styles } from './VirtualListBody.stylex';
import { VirtualListBodyChildren } from './VirtualListBodyChildren/VirtualListBodyChildren.component';

/**
 * Owns the scroll container and the infinite-scroll sentinel (Table analog:
 * TableContent). Content-mode dispatch and virtualization live one level
 * down in VirtualListBodyChildren.
 */
export const VirtualListBody = ({
  listMaxHeight,
  shouldFillHeight,
}: VirtualListBodyProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasFetchMore = useGetHasFetchMore();
  const hasMore = useGetHasMore();
  const isLoadingOptions = useGetIsLoadingOptions();
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
