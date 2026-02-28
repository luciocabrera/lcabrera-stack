import * as stylex from '@stylexjs/stylex';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { VirtualListDataState } from '@/components/VirtualList';
import type { SelectFilter } from '@/types/filterOperators.types';

import { Tag } from '@/components/Tag';
import { VirtualList } from '@/components/VirtualList';
import { useClickOutside } from '@/hooks';

import type { VirtualSelectProps } from './VirtualSelect.types';

import { styles } from './VirtualSelect.stylex';

export const VirtualSelect = ({
  dataState,
  listMaxHeight = '18.75rem',
  mode,
  onChange,
  onFetchInitial,
  onFetchMore,
  onOpenChange,
  options = [],
  placeholder = 'Select...',
  selected,
  showLoadedCount = true,
}: VirtualSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  useClickOutside({
    onClickOutside: handleClose,
    ref: containerRef,
  });

  // Static mode: wrap options in a VirtualListDataState
  const effectiveDataState: VirtualListDataState = useMemo(
    () =>
      dataState ?? {
        data: options,
        hasMore: false,
        isLoading: false,
        isLoadingMore: false,
      },
    [dataState, options],
  );

  const handleToggleDropdown = useCallback(() => {
    setIsOpen((isCurrentlyOpen) => !isCurrentlyOpen);
  }, []);

  const handleVirtualListChange = useCallback(
    (filter?: SelectFilter) => {
      const values = filter?.values ?? [];

      if (mode === 'single') {
        // Find the newly added value (not in current selected)
        const newValue = values.find((v) => !selected.includes(v));
        onChange(newValue ? [newValue] : []);
        handleClose();
        return;
      }

      onChange(values);
    },
    [handleClose, mode, onChange, selected],
  );

  const handleRemoveTag = useCallback(
    (option: string) => {
      onChange(selected.filter((v) => v !== option));
    },
    [onChange, selected],
  );

  const hasSelection = selected.length > 0;

  return (
    <div ref={containerRef} {...stylex.props(styles.container)}>
      {/* Trigger / input area */}
      <div
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        onClick={handleToggleDropdown}
        role='combobox'
        tabIndex={0}
        {...stylex.props(styles.trigger, isOpen && styles.triggerOpen)}
      >
        {hasSelection ? (
          mode === 'single' ? (
            <span {...stylex.props(styles.triggerLabel)}>{selected[0]}</span>
          ) : (
            selected.map((value) => (
              <Tag
                key={value}
                label={value}
                onRemove={() => {
                  handleRemoveTag(value);
                }}
              />
            ))
          )
        ) : (
          <span {...stylex.props(styles.triggerPlaceholder)}>
            {placeholder}
          </span>
        )}
        <span {...stylex.props(styles.chevron(isOpen))} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div role='listbox' {...stylex.props(styles.dropdown)}>
          <VirtualList
            dataState={effectiveDataState}
            filter={{ type: 'select', values: selected }}
            hasCheckboxes={mode === 'multi'}
            hasSelectAll={mode === 'multi'}
            listMaxHeight={listMaxHeight}
            onChange={handleVirtualListChange}
            onFetchInitial={onFetchInitial}
            onFetchMore={onFetchMore}
          />
        </div>
      )}

      {/* Loaded count legend */}
      {showLoadedCount && effectiveDataState.totalCount  && (
        <p {...stylex.props(styles.loadedCount)}>
          Loaded: {effectiveDataState.data.length} /{' '}
          {effectiveDataState.totalCount}
          {effectiveDataState.isLoading && ' — Loading...'}
          {effectiveDataState.isLoadingMore && ' — Loading more...'}
        </p>
      )}
    </div>
  );
};
