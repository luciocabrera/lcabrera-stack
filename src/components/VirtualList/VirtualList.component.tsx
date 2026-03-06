import * as stylex from '@stylexjs/stylex';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/Button';
import {
  ListAllIcon,
  ListCheckedIcon,
  ListUncheckedIcon,
  MenuCloseIcon,
} from '@/components/Icons';
import { InfoBox } from '@/components/InfoBox';
import { useVirtualization } from '@/hooks';

import type { ListFilterMode, VirtualListProps } from './VirtualList.types';

import { SkeletonOptions } from './SkeletonOptions';
import { getFilteredOptions } from './utils';
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
  shouldFillHeight = false,
}: VirtualListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [listFilterMode, setListFilterMode] = useState<ListFilterMode>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { hasMore, isLoading, isLoadingMore } = dataState;
  const isLoadingOptions = isLoading || isLoadingMore || false;
  // Derive selectedValues from filter prop - fully controlled by parent
  const selectedValues = filter?.values ?? [];
  // Options from dataState (populated externally or passed statically)
  const effectiveOptions = dataState.data;
  const isInitialLoading = isLoading && effectiveOptions.length === 0;

  const filteredOptions = getFilteredOptions({
    listFilterMode,
    options: effectiveOptions,
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
    <div
      {...stylex.props(
        styles.container,
        shouldFillHeight ? styles.containerFill : undefined,
      )}
    >
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
          {...stylex.props(
            styles.searchInput,
            searchTerm ? styles.searchInputWithClear : undefined,
          )}
        />
        {searchTerm && (
          <Button
            aria-label='Clear search'
            color='ghost'
            icon={<MenuCloseIcon size={16} />}
            onClick={handleClearSearch}
            size='embedded'
            variant='flat'
            width='auto'
          />
        )}
      </div>
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
          {isInitialLoading ? (
            <SkeletonOptions containerHeight={containerHeight} />
          ) : filteredOptions.length === 0 ? (
            <div {...stylex.props(styles.noResults)}>
              <InfoBox>No options found</InfoBox>
            </div>
          ) : (
            <div {...stylex.props(styles.virtualScrollArea(totalHeight))}>
              <div {...stylex.props(styles.virtualOffset(offsetY))}>
                {Array.from({ length: endIndex - startIndex }).map((_, i) => {
                  const index = startIndex + i;
                  const key =
                    index === 0 && shouldShowSelectAll
                      ? 'select-all'
                      : (filteredOptions[
                          shouldShowSelectAll ? index - 1 : index
                        ] ?? `option-${index}`);

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
      {/* Footer: loaded count + list filter */}
      {dataState.data.length > 0 ? (
        <div {...stylex.props(styles.footer)}>
          <p {...stylex.props(styles.loadedCount)}>
            Loaded: {dataState.data.length}
            {Number.isFinite(dataState.totalCount) && dataState.totalCount
              ? ` / ${dataState.totalCount}`
              : ''}
            {dataState.isLoading && ' — Loading...'}
            {dataState.isLoadingMore && ' — Loading more...'}
          </p>
          {hasCheckboxes && (
            <div {...stylex.props(styles.listFilterGroup)}>
              {(['all', 'selected', 'unselected'] as const).map((mode) => (
                <Button
                  color={listFilterMode === mode ? 'secondary' : 'ghost'}
                  icon={
                    mode === 'all' ? (
                      <ListAllIcon size={16} />
                    ) : mode === 'selected' ? (
                      <ListCheckedIcon size={16} />
                    ) : (
                      <ListUncheckedIcon size={16} />
                    )
                  }
                  key={mode}
                  onClick={() => {
                    setListFilterMode(mode);
                  }}
                  size='mini'
                  variant='flat'
                  width='auto'
                />
              ))}
            </div>
          )}
        </div>
      ) : undefined}
    </div>
  );
};
