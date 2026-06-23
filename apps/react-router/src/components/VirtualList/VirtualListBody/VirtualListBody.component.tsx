import * as stylex from '@stylexjs/stylex';
import { useCallback, useEffect, useRef } from 'react';

import { InfoBox } from '@/components/InfoBox';
import { useVirtualization } from '@/hooks';

import type { VirtualListBodyProps } from './VirtualListBody.types';

import { SkeletonOptions } from '../SkeletonOptions';
import { getFilteredOptions } from '../utils';
import {
  DEFAULT_CONTAINER_HEIGHT,
  ITEM_HEIGHT,
  SCROLL_THRESHOLD,
} from '../VirtualList.constants';
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

  const { data, hasMore, isLoading, isLoadingMore } = dataState;
  const isBootstrappingInitialLoad =
    Boolean(onFetchInitial) &&
    data.length === 0 &&
    !(isLoading || isLoadingMore);
  const isLoadingOptions = isLoading || isLoadingMore;
  const isInitialLoading =
    data.length === 0 && (isLoading || isBootstrappingInitialLoad);

  const filteredOptions = getFilteredOptions({
    listFilterMode,
    options: data,
    searchTerm,
    selectedValues,
  });

  const shouldShowSelectAll = hasSelectAll && filteredOptions.length > 1;
  const totalItems = shouldShowSelectAll
    ? filteredOptions.length + 1
    : filteredOptions.length;
  const isAllSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((option) => selectedValues.includes(option));

  const { containerHeight, endIndex, offsetY, startIndex, totalHeight } =
    useVirtualization({
      containerRef: scrollContainerRef,
      defaultContainerHeight: DEFAULT_CONTAINER_HEIGHT,
      itemHeight: ITEM_HEIGHT,
      overscan: 5,
      totalItems,
    });

  const handleLoadMore = useCallback(() => {
    if (!onFetchMore || !hasMore || isLoadingOptions) return;
    void onFetchMore();
  }, [hasMore, isLoadingOptions, onFetchMore]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore || isLoadingMore) return;

    const { clientHeight, scrollHeight, scrollTop } = container;
    if (scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD) {
      handleLoadMore();
    }
  }, [handleLoadMore, hasMore, isLoadingMore]);

  useEffect(() => {
    if (onFetchInitial) {
      void onFetchInitial();
    }
  }, [onFetchInitial]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

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
        {isInitialLoading && (
          <SkeletonOptions containerHeight={containerHeight} />
        )}
        {!isInitialLoading && filteredOptions.length === 0 && (
          <div {...stylex.props(styles.noResults)}>
            <InfoBox>No options found</InfoBox>
          </div>
        )}
        {!isInitialLoading && filteredOptions.length > 0 && (
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
        )}
      </div>
    </div>
  );
};
