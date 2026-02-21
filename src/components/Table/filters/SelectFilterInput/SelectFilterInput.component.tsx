import * as stylex from '@stylexjs/stylex';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { FilterOptionsResponse } from '@/components/Table/Table.types';

import { InfoBox } from '@/components/InfoBox';
import { useGetNormalizedColumn } from '@/components/Table/contexts/TableConfig/columns/selectors';
import {
  useFetchFilterData,
  useFetchMoreFilterData,
} from '@/components/Table/contexts/TableData/filters/actions';
import { useGetFilterData } from '@/components/Table/contexts/TableData/filters/selectors';
import { useVirtualization } from '@/hooks';

import type { SelectFilterInputProps } from './SelectFilterInput.types';

import { styles } from './SelectFilterInput.stylex';
import { SkeletonOptions } from './SkeletonOptions';
import { VirtualizedOption } from './VirtualizedOption';

const ITEM_HEIGHT = 32; // Height of each checkbox option in pixels

/** Pure value selector (checkboxes list) - operator is controlled by FilterInputs */
export const SelectFilterInput = <TData,>({
  columnKey,
  filter,
  listMaxHeight = '18.75rem',
  onChange,
}: SelectFilterInputProps<TData>) => {
  const column = useGetNormalizedColumn<TData>(columnKey);
  const filterData = useGetFilterData<TData>(columnKey);

  const fetchFilterData = useFetchFilterData<string, FilterOptionsResponse>(
    columnKey,
  );
  const fetchMoreFilterData = useFetchMoreFilterData<
    string,
    FilterOptionsResponse
  >(columnKey);

  const [searchTerm, setSearchTerm] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { hasMore, isLoading, isLoadingMore } = filterData;

  const isLoadingOptions = isLoading || isLoadingMore || false;

  // Derive selectedValues from filter prop - fully controlled by parent
  const selectedValues = filter?.values ?? [];

  // Options from store (populated by fetchFilterData / fetchMoreFilterData)
  const effectiveOptions = filterData.data;

  const isInitialLoading = isLoading && effectiveOptions.length === 0;

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return effectiveOptions;
    return effectiveOptions.filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [effectiveOptions, searchTerm]);

  // Add 1 to total items for "Select All" checkbox if showing it
  const totalItems =
    filteredOptions.length > 1
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

  const handleLoadMoreOptions = useCallback(() => {
    if (!column.fetchFilterOptions || !hasMore || isLoadingOptions) {
      return;
    }

    void fetchMoreFilterData({
      dataSelector: column.filterOptionsDataSelector,
      dataTotalSelector: column.filterOptionsDataTotalSelector,
      onLoadMore: column.fetchFilterOptions,
    });
  }, [
    column.fetchFilterOptions,
    column.filterOptionsDataSelector,
    column.filterOptionsDataTotalSelector,
    fetchMoreFilterData,
    hasMore,
    isLoadingOptions,
  ]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore || isLoadingMore) {
      return;
    }

    const { clientHeight, scrollHeight, scrollTop } = container;
    const scrollThreshold = 50; // Load more when 50px from bottom

    if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
      handleLoadMoreOptions();
    }
  }, [handleLoadMoreOptions, hasMore, isLoadingMore]);

  // Fetch initial filter data on mount if column supports async filter options
  useEffect(() => {
    if (column.fetchFilterOptions) {
      void fetchFilterData({
        dataSelector: column.filterOptionsDataSelector,
        dataTotalSelector: column.filterOptionsDataTotalSelector,
        onLoadMore: column.fetchFilterOptions,
      });
    }
  }, [
    column.fetchFilterOptions,
    column.filterOptionsDataSelector,
    column.filterOptionsDataTotalSelector,
    fetchFilterData,
  ]);

  // Attach scroll listener
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
      <input
        autoComplete='off'
        data-1p-ignore='true'
        data-bwignore='true'
        data-form-type='other'
        data-lpignore='true'
        data-np-checked='1'
        data-np-ignore='1'
        name={`filter-search-${columnKey}`}
        onChange={handleSearchChange}
        placeholder='Search options...'
        type='text'
        value={searchTerm}
        {...stylex.props(styles.searchInput)}
      />
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
                      index={index}
                      isAllSelected={isAllSelected}
                      isLoading={isLoadingOptions}
                      key={
                        index === 0 && filteredOptions.length > 1
                          ? 'select-all'
                          : (filteredOptions[
                              filteredOptions.length > 1 ? index - 1 : index
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
