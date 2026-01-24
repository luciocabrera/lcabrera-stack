import * as stylex from '@stylexjs/stylex';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/Button';
import { MenuCloseIcon } from '@/components/Icons';
import { usePopoverPositioning } from '@/hooks/usePopoverPositioning.hook';

import type { FilterPopoverProps, ToggleEvent } from './FilterPopover.types';

import { styles } from './FilterPopover.stylex';
import { getOperatorFromFilter, renderFilterInput } from './utils';

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
  // Ref to always access latest filter value (avoids stale closure in toggle handler)
  const filterRef = useRef(filter);
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  // Local state to track the current filter value before applying
  // Reset imperatively on popover open, not via effect
  const [localFilter, setLocalFilter] = useState(filter);
  // State for dynamically fetched options
  const [fetchedOptions, setFetchedOptions] = useState<string[]>();
  const [isFetchingOptions, setIsFetchingOptions] = useState(false);
  const [hasMoreOptions, setHasMoreOptions] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const hasOptions =
    Boolean(filterOptions && filterOptions.length > 0) ||
    Boolean(fetchFilterOptions);

  // Use fetched options if available, otherwise fall back to provided options
  const effectiveFilterOptions = fetchedOptions ?? filterOptions;

  // Use positioning hook
  const { resetPositioning } = usePopoverPositioning({
    columnDataType: column.dataType,
    hasOptions,
    isOpen: isPopoverOpen,
    popoverId,
    popoverRef,
    recalculateDeps: [effectiveFilterOptions],
  });

  // Handle popover toggle events
  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;

    const handlePopoverToggle = (e: Event) => {
      const toggleEvent = e as ToggleEvent;
      if (toggleEvent.newState === 'open') {
        setIsPopoverOpen(true);
        // Reset local filter to committed value from URL/context on every open
        // This ensures any unapplied draft changes are discarded
        // Use ref to get the latest filter value (avoids stale closure)
        setLocalFilter(filterRef.current);
        // Lock body scroll to prevent outer scrollbar
        document.body.style.overflow = 'hidden';

        // Fetch options when popover opens (if needed)
        if (fetchFilterOptions && !fetchedOptions && !isFetchingOptions) {
          setIsFetchingOptions(true);
          void fetchFilterOptions(0)
            .then((result: { hasMore: boolean; values: string[] }) => {
              setFetchedOptions(result.values);
              setHasMoreOptions(result.hasMore);
            })
            .catch((error: unknown) => {
              console.error('[FilterPopover] Failed to fetch options:', error);
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
        setFetchedOptions((prev) => [...(prev ?? []), ...result.values]);
        setHasMoreOptions(result.hasMore);
      })
      .catch((error: unknown) => {
        console.error('❌ [FilterPopover] Failed to load more options:', error);
      })
      .finally(() => {
        setIsFetchingOptions(false);
      });
  }, [fetchFilterOptions, fetchedOptions, isFetchingOptions, hasMoreOptions]);

  // Get current operator from the local filter to determine if we're showing a list
  const currentOperator = getOperatorFromFilter(localFilter);

  // Fixed heights for both use cases
  // 25rem: When list is visible (string column with options AND operator is equals/notEquals)
  // 12rem: All other cases (no list)
  const isListShowing =
    column.dataType === 'string' &&
    hasOptions &&
    (currentOperator === 'equals' || currentOperator === 'notEquals');

  const popoverMinHeight = isListShowing ? '25rem' : '12rem';

  const content = renderFilterInput({
    column,
    effectiveFilterOptions,
    filter: localFilter,
    handleLoadMoreOptions,
    hasMoreOptions,
    isFetchingOptions,
    setLocalFilter,
  });

  return (
    <div
      id={popoverId}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...({ popover: 'auto' } as any)}
      ref={popoverRef}
      {...stylex.props(styles.popover(popoverMinHeight))}
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
        <div {...stylex.props(styles.body)}>{content}</div>
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
