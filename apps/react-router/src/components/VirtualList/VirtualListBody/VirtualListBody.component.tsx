import * as stylex from '@stylexjs/stylex';
import { useCallback, useEffect, useRef } from 'react';

import { InfoBox } from '@/components/InfoBox';
import { useVirtualization } from '@/hooks';

import type { VirtualListBodyProps } from './VirtualListBody.types';

import { SkeletonOptions } from '../SkeletonOptions';
import { getFilteredOptions } from '../utils';
import { VirtualizedOption } from '../VirtualizedOption';
import {
  DEFAULT_CONTAINER_HEIGHT,
  ITEM_HEIGHT,
  SCROLL_THRESHOLD,
} from '../VirtualList.constants';
import { styles } from './VirtualListBody.stylex';

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

  const handleToggle = (option: string) => {
    const newSelectedValues = selectedValues.includes(option)
      ? selectedValues.filter((value) => value !== option)
      : [...selectedValues, option];

    onChange({
      type: 'select',
      values: newSelectedValues,
    });
  };

  const handleSelectAll = () => {
    const newSelectedValues = isAllSelected
      ? selectedValues.filter((value) => !filteredOptions.includes(value))
      : [...new Set([...selectedValues, ...filteredOptions])];

    onChange({
      type: 'select',
      values: newSelectedValues,
    });
  };

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
          <div {...stylex.props(styles.virtualScrollArea(totalHeight))}>
            <div {...stylex.props(styles.virtualOffset(offsetY))}>
              {Array.from({ length: endIndex - startIndex }).map((_, i) => {
                const index = startIndex + i;
                let key = `option-${index}`;
                if (index === 0 && shouldShowSelectAll) {
                  key = 'select-all';
                } else {
                  const optionIndex = shouldShowSelectAll ? index - 1 : index;
                  key = filteredOptions[optionIndex] ?? key;
                }

                return (
                  <VirtualizedOption
                    filteredOptions={filteredOptions}
                    hasCheckboxes={hasCheckboxes}
                    hasSelectAll={shouldShowSelectAll}
                    index={index}
                    isAllSelected={isAllSelected}
                    isLoading={isLoadingOptions}
                    key={key}
                    onSelectAll={handleSelectAll}
                    onToggle={handleToggle}
                    selectedValues={selectedValues}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
