import * as stylex from '@stylexjs/stylex';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { InfoBox } from '@/components/InfoBox';
import { useVirtualization } from '@/hooks';

import type { VirtualListProps } from './VirtualList.types';

import { SkeletonOptions } from './SkeletonOptions';
import { VirtualizedOption } from './VirtualizedOption';
import { styles } from './VirtualList.stylex';

const ITEM_HEIGHT = 32;

export const VirtualList = ({
  dataState,
  filter,
  hasCheckboxes = true,
  hasSelectAll = true,
  listMaxHeight = '18.75rem',
  name,
  onChange,
  onFetchInitial,
  onFetchMore,
}: VirtualListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { hasMore, isLoading, isLoadingMore } = dataState;

  const isLoadingOptions = isLoading || isLoadingMore || false;

  // Derive selectedValues from filter prop - fully controlled by parent
  const selectedValues = filter?.values ?? [];

  // Options from dataState (populated externally or passed statically)
  const effectiveOptions = dataState.data;

  const isInitialLoading = isLoading && effectiveOptions.length === 0;

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return effectiveOptions;
    return effectiveOptions.filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [effectiveOptions, searchTerm]);

  const shouldShowSelectAll = hasSelectAll && filteredOptions.length > 1;

  const totalItems = shouldShowSelectAll
    ? filteredOptions.length + 1
    : filteredOptions.length;

  const isAllSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((option) => selectedValues.includes(option));

  const { endIndex, offsetY, startIndex, totalHeight } = useVirtualization({
    containerRef: scrollContainerRef,
    defaultContainerHeight: 300,
    itemHeight: ITEM_HEIGHT,
    overscan: 5,
    totalItems,
  });

  const handleToggle = (option: string) => {
    const newSelectedValues = selectedValues.includes(option)
      ? selectedValues.filter((v) => v !== option)
      : [...selectedValues, option];

    onChange({
      type: 'select',
      values: newSelectedValues,
    });
  };

  const handleSelectAll = () => {
    const newSelectedValues = isAllSelected ? [] : filteredOptions;

    onChange({
      type: 'select',
      values: newSelectedValues,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleLoadMore = useCallback(() => {
    if (!onFetchMore || !hasMore || isLoadingOptions) return;
    void onFetchMore();
  }, [hasMore, isLoadingOptions, onFetchMore]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore || isLoadingMore) return;

    const { clientHeight, scrollHeight, scrollTop } = container;
    const scrollThreshold = 50;

    if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
      handleLoadMore();
    }
  }, [handleLoadMore, hasMore, isLoadingMore]);

  // Fetch initial data on mount
  useEffect(() => {
    if (onFetchInitial) {
      void onFetchInitial();
    }
  }, [onFetchInitial]);

  // Attach scroll listener for infinite loading
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.searchInputWrapper)}>
        <input
          autoComplete='off'
          data-1p-ignore='true'
          data-bwignore='true'
          data-form-type='other'
          data-lpignore='true'
          data-np-checked='1'
          data-np-ignore='1'
          name={name}
          onChange={handleSearchChange}
          placeholder='Search options...'
        type='text'
          value={searchTerm}
          {...stylex.props(styles.searchInput)}
        />
      </div>
      <div {...stylex.props(styles.optionsList)}>
        <div
          ref={scrollContainerRef}
          {...stylex.props(styles.virtualContainer(listMaxHeight))}
        >
          {isInitialLoading ? (
            <SkeletonOptions />
          ) : filteredOptions.length === 0 ? (
            <div {...stylex.props(styles.noResults)}>
              <InfoBox>No options found</InfoBox>
            </div>
          ) : (
            <div {...stylex.props(styles.virtualScrollArea(totalHeight))}>
              <div {...stylex.props(styles.virtualOffset(offsetY))}>
                {Array.from({ length: endIndex - startIndex }).map((_, i) => {
                  const index = startIndex + i;

                  return (
                    <VirtualizedOption
                      filteredOptions={filteredOptions}
                      hasCheckboxes={hasCheckboxes}
                      hasSelectAll={shouldShowSelectAll}
                      index={index}
                      isAllSelected={isAllSelected}
                      isLoading={isLoadingOptions}
                      key={
                        index === 0 && shouldShowSelectAll
                          ? 'select-all'
                          : (filteredOptions[
                              shouldShowSelectAll ? index - 1 : index
                            ] ?? `option-${index}`)
                      }
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
    </div>
  );
};
