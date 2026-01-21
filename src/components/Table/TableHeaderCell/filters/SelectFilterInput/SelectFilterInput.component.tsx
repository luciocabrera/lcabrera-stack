import * as stylex from '@stylexjs/stylex';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useVirtualization } from '@/hooks/useVirtualization.hook';

import type { SelectFilterInputProps } from './SelectFilterInput.types';

import { styles } from './SelectFilterInput.stylex';
import { VirtualizedOption } from './VirtualizedOption';

const ITEM_HEIGHT = 32; // Height of each checkbox option in pixels

export const SelectFilterInput = ({
  filter,
  hasMore = false,
  isLoadingMore = false,
  onChange,
  onLoadMore,
  options,
}: SelectFilterInputProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>(
    filter?.values ?? [],
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [options, searchTerm]);

  // Add 1 to total items for "Select All" checkbox if showing it
  const totalItems =
    filteredOptions.length > 1
      ? filteredOptions.length + 1
      : filteredOptions.length;

  const { bottomSpacerHeight, endIndex, offsetY, startIndex, totalHeight } =
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

    setSelectedValues(newSelectedValues);

    if (newSelectedValues.length === 0) {
      onChange();
    } else {
      onChange({
        type: 'select',
        values: newSelectedValues,
      });
    }
  };

  const handleSelectAll = () => {
    const isAllSelected = filteredOptions.length === selectedValues.length;
    const newSelectedValues = isAllSelected ? [] : filteredOptions;

    setSelectedValues(newSelectedValues);

    if (newSelectedValues.length > 0) {
      onChange({
        type: 'select',
        values: newSelectedValues,
      });
    }
  };

  const isAllSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((option) => selectedValues.includes(option));

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !onLoadMore || !hasMore || isLoadingMore) {
      return;
    }

    const { clientHeight, scrollHeight, scrollTop } = container;
    const scrollThreshold = 50; // Load more when 50px from bottom

    if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
      console.warn(
        '📜 [SelectFilterInput] Near bottom, loading more options...',
      );
      onLoadMore();
    }
  }, [onLoadMore, hasMore, isLoadingMore]);

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
        onChange={(e) => {
          setSearchTerm(e.target.value);
        }}
        placeholder='Search options...'
        type='text'
        value={searchTerm}
        {...stylex.props(styles.searchInput)}
      />
      <div {...stylex.props(styles.optionsList)}>
        {filteredOptions.length === 0 ? (
          <div {...stylex.props(styles.noResults)}>No options found</div>
        ) : (
          <div
            ref={scrollContainerRef}
            {...stylex.props(styles.virtualContainer(totalHeight))}
          >
            <div {...stylex.props(styles.virtualOffset(offsetY))}>
              {Array.from({ length: endIndex - startIndex }).map((_, i) => {
                const index = startIndex + i;

                return (
                  <VirtualizedOption
                    filteredOptions={filteredOptions}
                    index={index}
                    isAllSelected={isAllSelected}
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
            <div {...stylex.props(styles.virtualSpacer(bottomSpacerHeight))} />
          </div>
        )}
        {isLoadingMore && (
          <div {...stylex.props(styles.loadingMore)}>
            Loading more options...
          </div>
        )}
      </div>
    </div>
  );
};
