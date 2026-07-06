import { InfoBox } from '@repo/ui/components/InfoBox';
import { useInfiniteScrollObserver, useVirtualization } from '@repo/ui/hooks';
import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef } from 'react';

import type { VirtualListBodyProps } from './VirtualListBody.types';

import { SkeletonOptions } from '../SkeletonOptions';
import {
  DEFAULT_CONTAINER_HEIGHT,
  ITEM_HEIGHT,
  SCROLL_THRESHOLD,
} from '../VirtualList.constants';
import { resolveVirtualListBodyState } from './utils';
import { styles } from './VirtualListBody.stylex';
import { VirtualListBodyOptions } from './VirtualListBodyOptions';

export const VirtualListBody = ({
  dataState,
  hasCheckboxes,
  hasSelectAll,
  listFilterMode,
  listMaxHeight,
  onChange,
  onFetchInitial,
  onFetchMore,
  searchTerm,
  selectedValues,
  shouldFillHeight,
}: VirtualListBodyProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    contentMode,
    filteredOptions,
    isAllSelected,
    isLoadingOptions,
    shouldShowSelectAll,
    totalItems,
  } = resolveVirtualListBodyState({
    dataState,
    hasFetchInitial: Boolean(onFetchInitial),
    hasSelectAll,
    listFilterMode,
    searchTerm,
    selectedValues,
  });

  const { containerHeight, endIndex, offsetY, startIndex, totalHeight } =
    useVirtualization({
      containerRef: scrollContainerRef,
      defaultContainerHeight: DEFAULT_CONTAINER_HEIGHT,
      itemHeight: ITEM_HEIGHT,
      overscan: 5,
      totalItems,
    });

  useEffect(() => {
    if (onFetchInitial) {
      void onFetchInitial();
    }
  }, [onFetchInitial]);

  useInfiniteScrollObserver({
    isEnabled:
      Boolean(dataState.hasMore) && !isLoadingOptions && Boolean(onFetchMore),
    onReachEnd: () => {
      if (onFetchMore) void onFetchMore();
    },
    rootRef: scrollContainerRef,
    sentinelRef,
    threshold: SCROLL_THRESHOLD,
  });

  const renderContent = () => {
    if (contentMode === 'loading') {
      return <SkeletonOptions containerHeight={containerHeight} />;
    }

    if (contentMode === 'empty') {
      return (
        <div {...stylex.props(styles.noResults)}>
          <InfoBox>No options found</InfoBox>
        </div>
      );
    }

    return (
      <VirtualListBodyOptions
        endIndex={endIndex}
        filteredOptions={filteredOptions}
        hasCheckboxes={hasCheckboxes}
        isAllSelected={isAllSelected}
        isLoadingOptions={isLoadingOptions}
        offsetY={offsetY}
        onChange={onChange}
        selectedValues={selectedValues}
        shouldShowSelectAll={shouldShowSelectAll}
        startIndex={startIndex}
        totalHeight={totalHeight}
      />
    );
  };

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
        {renderContent()}
        <div aria-hidden ref={sentinelRef} {...stylex.props(styles.sentinel)} />
      </div>
    </div>
  );
};
