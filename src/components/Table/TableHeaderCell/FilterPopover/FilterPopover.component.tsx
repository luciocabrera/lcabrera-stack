import * as stylex from '@stylexjs/stylex';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/Button';
import { MenuCloseIcon } from '@/components/Icons';

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
  // Track the selected text operator for conditional rendering
  const [textOperator, setTextOperator] = useState<
    | 'contains'
    | 'endsWith'
    | 'equals'
    | 'notContains'
    | 'notEquals'
    | 'startsWith'
  >('equals');

  // Sync local filter with prop when it changes externally
  useEffect(() => {
    setLocalFilter(filter);
  }, [filter]);

  // Handle popover toggle events and positioning
  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;

    const handlePopoverToggle = (e: Event) => {
      const toggleEvent = e as ToggleEvent;
      if (toggleEvent.newState === 'open') {
        // Lock body scroll to prevent outer scrollbar
        document.body.style.overflow = 'hidden';
        
        // Position popover relative to the trigger button
        const triggerButton = document.querySelector<HTMLElement>(
          `[popovertarget="${popoverId}"]`,
        );
        if (!triggerButton) return;

        const buttonRect = triggerButton.getBoundingClientRect();
        const popoverRect = popover.getBoundingClientRect();

        // Calculate available space with some padding
        const SPACING = 8;
        const OFFSET = 4; // Offset between button and popover
        const spaceBelow = window.innerHeight - buttonRect.bottom - SPACING - OFFSET;
        const spaceAbove = buttonRect.top - SPACING - OFFSET;
        const shouldPositionAbove = spaceBelow < popoverRect.height && spaceAbove > spaceBelow;

        // Calculate max height based on available space
        const maxHeight = shouldPositionAbove ? spaceAbove : spaceBelow;

        // Check if popover would go off-screen on the right
        const left = buttonRect.left;
        const rightEdge = left + popoverRect.width;
        const adjustedLeft =
          rightEdge > window.innerWidth
            ? window.innerWidth - popoverRect.width - SPACING
            : left;

        popover.style.left = `${adjustedLeft}px`;
        popover.style.maxHeight = `${maxHeight}px`;
        
        if (shouldPositionAbove) {
          // Position above button - anchor to bottom of viewport
          popover.style.bottom = `${window.innerHeight - buttonRect.top + 4}px`;
          popover.style.top = 'auto';
        } else {
          // Position below button - anchor to top
          popover.style.top = `${buttonRect.bottom + 4}px`;
          popover.style.bottom = 'auto';
        }
        
        popover.style.margin = '0';
        popover.style.opacity = '1';

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
      } else if (toggleEvent.newState === 'closed') {
        // Unlock body scroll when popover closes
        document.body.style.overflow = '';
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
    popoverId,
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
            // eslint-disable-next-line unicorn/no-null
            filter={localFilter?.type === 'boolean' ? localFilter : null}
            onChange={setLocalFilter}
          />
        );
      }
      case 'currency':
      case 'number': {
        return (
          <NumberFilterInput
            // eslint-disable-next-line unicorn/no-null
            filter={localFilter?.type === 'number' ? localFilter : null}
            onChange={setLocalFilter}
          />
        );
      }
      case 'date': {
        return (
          <DateFilterInput
            // eslint-disable-next-line unicorn/no-null
            filter={localFilter?.type === 'date' ? localFilter : null}
            onChange={setLocalFilter}
          />
        );
      }
      case 'string': {
        // Use SelectFilterInput if we have filter options (facet filter)
        if (effectiveFilterOptions && effectiveFilterOptions.length > 0) {
          const showSelectList =
            textOperator === 'equals' || textOperator === 'notEquals';

          return (
            <div {...stylex.props(styles.stringFilterContainer)}>
              <TextFilterInput
                // eslint-disable-next-line unicorn/no-null
                filter={localFilter?.type === 'text' ? localFilter : null}
                onChange={setLocalFilter}
                onOperatorChange={setTextOperator}
              />
              {showSelectList && (
                <SelectFilterInput
                  // eslint-disable-next-line unicorn/no-null
                  filter={localFilter?.type === 'select' ? localFilter : null}
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
            // eslint-disable-next-line unicorn/no-null
            filter={localFilter?.type === 'text' ? localFilter : null}
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
