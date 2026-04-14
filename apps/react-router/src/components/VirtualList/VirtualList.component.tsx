import * as stylex from '@stylexjs/stylex';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/Button';
import { MenuCloseIcon } from '@/components/Icons';
import { InfoBox } from '@/components/InfoBox';
import { ICON_SIZE_MD } from '@/design-system/constants';
import { useVirtualization } from '@/hooks';

import type { ListFilterMode, VirtualListProps } from './VirtualList.types';

import { SkeletonOptions } from './SkeletonOptions';
import { getFilteredOptions } from './utils';
import { VirtualizedOption } from './VirtualizedOption';
import {
  DEFAULT_CONTAINER_HEIGHT,
  ITEM_HEIGHT,
  LIST_MAX_HEIGHT,
  SCROLL_THRESHOLD,
} from './VirtualList.constants';
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
            customStylex={styles.clearButton}
            icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
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
      <VirtualListFooter
        dataState={dataState}
        effectiveOptions={effectiveOptions}
        hasCheckboxes={hasCheckboxes}
        listFilterMode={listFilterMode}
        selectedValues={selectedValues}
        setListFilterMode={setListFilterMode}
      />
    </div>
  );
};
