import * as stylex from '@stylexjs/stylex';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/Button';
import { MenuCloseIcon } from '@/components/Icons';
import { usePopoverPositioning } from '@/hooks/usePopoverPositioning.hook';

import type { FilterPopoverProps, ToggleEvent } from './FilterPopover.types';

import { BooleanFilterInput } from '../filters/BooleanFilterInput';
import { DateFilterInput } from '../filters/DateFilterInput';
import { NumberFilterInput } from '../filters/NumberFilterInput';
import { SelectFilterInput } from '../filters/SelectFilterInput';
import { TextFilterInput } from '../filters/TextFilterInput';
import { styles } from './FilterPopover.stylex';

export const FilterPopover = ({
  column,
  fetchFilterOptions,
  filter,
  filterOptions,
  onApply,
  onClear,
  popoverId,
}: FilterPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  // Local state to track the current filter value before applying
  const [localFilter, setLocalFilter] = useState(filter);
  // State for dynamically fetched options
  const [fetchedOptions, setFetchedOptions] = useState<string[]>();
  const [isFetchingOptions, setIsFetchingOptions] = useState(false);
  const [hasMoreOptions, setHasMoreOptions] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  // Track the selected text operator for conditional rendering
  const [textOperator, setTextOperator] = useState<
    | 'contains'
    | 'endsWith'
    | 'equals'
    | 'notContains'
    | 'notEquals'
    | 'startsWith'
  >('equals');

  // Sync textOperator when filter changes
  useEffect(() => {
    if (filter?.type === 'text') {
      setTextOperator(filter.operator);
    }
  }, [filter]);

  // Sync localFilter when filter prop changes
  useEffect(() => {
    setLocalFilter(filter);
  }, [filter]);

  const hasOptions =
    Boolean(filterOptions && filterOptions.length > 0) ||
    Boolean(fetchFilterOptions);

  // Use positioning hook
  const { resetPositioning } = usePopoverPositioning({
    columnDataType: column.dataType,
    hasOptions,
    isOpen: isPopoverOpen,
    popoverId,
    popoverRef,
    recalculateDeps: [textOperator, fetchedOptions],
  });

  // Handle popover toggle events
  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;

    const handlePopoverToggle = (e: Event) => {
      const toggleEvent = e as ToggleEvent;
      if (toggleEvent.newState === 'open') {
        setIsPopoverOpen(true);
        // Lock body scroll to prevent outer scrollbar
        document.body.style.overflow = 'hidden';

        // Fetch options when popover opens (if needed)
        if (fetchFilterOptions && !fetchedOptions && !isFetchingOptions) {
          setIsFetchingOptions(true);
          void fetchFilterOptions(0)
            .then((result: { hasMore: boolean; values: string[] }) => {
              console.warn(
                '✅ [FilterPopover] Fetched options for',
                column.key,
                ':',
                result.values.length,
                'hasMore:',
                result.hasMore,
              );
              setFetchedOptions(result.values);
              setHasMoreOptions(result.hasMore);
            })
            .catch((error: unknown) => {
              console.error(
                '❌ [FilterPopover] Failed to fetch options:',
                error,
              );
            })
            .finally(() => {
              setIsFetchingOptions(false);
            });
        }

        // Focus first input when popover opens
        setTimeout(() => {
          const firstInput = popover.querySelector('input, select');
          if (firstInput) {
            (firstInput as HTMLElement).focus();
          }
        }, 0);
      } else {
        setIsPopoverOpen(false);
        // Unlock body scroll when popover closes
        document.body.style.overflow = '';
        // Reset positioning for next open
        resetPositioning();
      }
    };

    popover.addEventListener('toggle', handlePopoverToggle);
    return () => {
      popover.removeEventListener('toggle', handlePopoverToggle);
    };
  }, [
    fetchFilterOptions,
    fetchedOptions,
    isFetchingOptions,
    column.key,
    resetPositioning,
  ]);

  // Handle loading more filter options (infinite scroll)
  const handleLoadMoreOptions = useCallback(() => {
    if (
      !fetchFilterOptions ||
      !fetchedOptions ||
      isFetchingOptions ||
      !hasMoreOptions
    ) {
      return;
    }

    setIsFetchingOptions(true);
    void fetchFilterOptions(fetchedOptions.length)
      .then((result: { hasMore: boolean; values: string[] }) => {
        console.warn(
          '✅ [FilterPopover] Loaded more options for',
          column.key,
          ':',
          result.values.length,
          'hasMore:',
          result.hasMore,
        );
        setFetchedOptions((prev) => [...(prev ?? []), ...result.values]);
        setHasMoreOptions(result.hasMore);
      })
      .catch((error: unknown) => {
        console.error('❌ [FilterPopover] Failed to load more options:', error);
      })
      .finally(() => {
        setIsFetchingOptions(false);
      });
  }, [
    fetchFilterOptions,
    fetchedOptions,
    isFetchingOptions,
    hasMoreOptions,
    column.key,
  ]);

  const renderFilterInput = () => {
    if (isFetchingOptions) {
      return (
        <div {...stylex.props(styles.loadingContainer)}>Loading options...</div>
      );
    }

    // Use fetched options if available, otherwise fall back to provided options
    const effectiveFilterOptions = fetchedOptions ?? filterOptions;

    switch (column.dataType) {
      case 'boolean': {
        return (
          <BooleanFilterInput
            filter={localFilter?.type === 'boolean' ? localFilter : undefined}
            onChange={setLocalFilter}
          />
        );
      }
      case 'currency':
      case 'number': {
        return (
          <NumberFilterInput
            filter={localFilter?.type === 'number' ? localFilter : undefined}
            onChange={setLocalFilter}
          />
        );
      }
      case 'date': {
        return (
          <DateFilterInput
            filter={localFilter?.type === 'date' ? localFilter : undefined}
            onChange={setLocalFilter}
          />
        );
      }
      case 'string': {
        // Use SelectFilterInput if we have filter options (facet filter)
        if (effectiveFilterOptions && effectiveFilterOptions.length > 0) {
          const isSelectListVisible =
            textOperator === 'equals' || textOperator === 'notEquals';

          return (
            <div {...stylex.props(styles.stringFilterContainer)}>
              <TextFilterInput
                filter={localFilter?.type === 'text' ? localFilter : undefined}
                onChange={setLocalFilter}
                onOperatorChange={setTextOperator}
              />
              {isSelectListVisible && (
                <SelectFilterInput
                  filter={
                    localFilter?.type === 'select' ? localFilter : undefined
                  }
                  hasMore={hasMoreOptions}
                  isLoadingMore={isFetchingOptions}
                  onChange={setLocalFilter}
                  onLoadMore={handleLoadMoreOptions}
                  options={effectiveFilterOptions}
                />
              )}
            </div>
          );
        }
        // Otherwise use TextFilterInput only
        return (
          <TextFilterInput
            filter={localFilter?.type === 'text' ? localFilter : undefined}
            onChange={setLocalFilter}
          />
        );
      }
      default: {
        return;
      }
    }
  };

  return (
    <div
      id={popoverId}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...({ popover: 'auto' } as any)}
      ref={popoverRef}
      {...stylex.props(styles.popover)}
    >
      <div {...stylex.props(styles.content)}>
        <div {...stylex.props(styles.header)}>
          <h3 {...stylex.props(styles.title)}>Filter: {column.label}</h3>
          <button
            aria-label='Close filter'
            onClick={() => {
              // Reset local filter to current applied filter when closing without applying
              setLocalFilter(filter);
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore - hidePopover not in TS types yet
              popoverRef.current?.hidePopover();
            }}
            type='button'
            {...stylex.props(styles.closeButton)}
          >
            <MenuCloseIcon size={16} />
          </button>
        </div>
        <div {...stylex.props(styles.body)}>{renderFilterInput()}</div>
        <div {...stylex.props(styles.footer)}>
          <Button
            color='outline'
            onClick={() => {
              setLocalFilter(undefined);
              onClear();
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore - hidePopover not in TS types yet
              popoverRef.current?.hidePopover();
            }}
            size='sm'
            width='full'
          >
            Clear
          </Button>
          <Button
            color='primary'
            onClick={() => {
              console.warn(
                '🎯 [FilterPopover] Apply clicked with localFilter:',
                localFilter,
              );
              onApply(localFilter);
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore - hidePopover not in TS types yet
              popoverRef.current?.hidePopover();
            }}
            size='sm'
            width='full'
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};
