import * as stylex from '@stylexjs/stylex';
import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useVirtualization } from '@/hooks';

import type { ListFilterMode, VirtualListProps } from './VirtualList.types';

import { getFilteredOptions } from './utils';
import {
  DEFAULT_CONTAINER_HEIGHT,
  ITEM_HEIGHT,
  LIST_MAX_HEIGHT,
  SCROLL_THRESHOLD,
} from './VirtualList.constants';
import { VirtualListBody } from './VirtualListBody';
import { VirtualListHeader } from './VirtualListHeader';
import { styles } from './VirtualList.stylex';
import { VirtualListFooter } from './VirtualListFooter';

export const VirtualList = ({
  dataState,
  filter,
  hasCheckboxes = true,
  hasSelectAll = true,
  listMaxHeight = LIST_MAX_HEIGHT,
  name,
  onChange,
  onFetchInitial,
  onFetchMore,
  shouldFillHeight = false,
}: VirtualListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [listFilterMode, setListFilterMode] = useState<ListFilterMode>('all');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data, hasMore, isLoading, isLoadingMore } = dataState;
  const isBootstrappingInitialLoad =
    Boolean(onFetchInitial) &&
    data.length === 0 &&
    !(isLoading || isLoadingMore);
  const isLoadingOptions = isLoading || isLoadingMore || false;
  // Derive selectedValues from filter prop - fully controlled by parent
  const selectedValues = filter?.values ?? [];

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
      ? selectedValues.filter((v) => v !== option)
      : [...selectedValues, option];

    onChange({
      type: 'select',
      values: newSelectedValues,
    });
  };

  const handleSelectAll = () => {
    const newSelectedValues = isAllSelected
      ? selectedValues.filter((v) => !filteredOptions.includes(v))
      : [...new Set([...selectedValues, ...filteredOptions])];

    onChange({
      type: 'select',
      values: newSelectedValues,
    });
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
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
    if (scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD) {
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
    <div
      {...stylex.props(
        styles.container,
        shouldFillHeight ? styles.containerFill : undefined,
      )}
    >
      <VirtualListHeader
        name={name}
        onClearSearch={handleClearSearch}
        onSearchChange={handleSearchChange}
        searchTerm={searchTerm}
      />
      <VirtualListBody
        containerHeight={containerHeight}
        endIndex={endIndex}
        filteredOptions={filteredOptions}
        hasCheckboxes={hasCheckboxes}
        isAllSelected={isAllSelected}
        isInitialLoading={isInitialLoading}
        isLoadingOptions={isLoadingOptions}
        listMaxHeight={listMaxHeight}
        offsetY={offsetY}
        onSelectAll={handleSelectAll}
        onToggle={handleToggle}
        scrollContainerRef={scrollContainerRef}
        selectedValues={selectedValues}
        shouldFillHeight={shouldFillHeight}
        shouldShowSelectAll={shouldShowSelectAll}
        startIndex={startIndex}
        totalHeight={totalHeight}
      />
      <VirtualListFooter
        dataState={dataState}
        effectiveOptions={data}
        hasCheckboxes={hasCheckboxes}
        listFilterMode={listFilterMode}
        selectedValues={selectedValues}
        setListFilterMode={setListFilterMode}
      />
    </div>
  );
};
