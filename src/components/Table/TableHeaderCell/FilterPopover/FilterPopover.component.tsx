import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/Button';
import { MenuCloseIcon } from '@/components/Icons';
import {
  useResetColumnFilter,
  useSetColumnFilter,
} from '@/components/Table/contexts/TableConfig/columns/actions';
import {
  useGetColumnFilters,
  useGetNormalizedColumn,
} from '@/components/Table/contexts/TableConfig/columns/selectors';
import { usePopoverPositioning } from '@/hooks/usePopoverPositioning.hook';
import { useRenderTracker } from '@/utils/performance';

import type { FilterPopoverProps, ToggleEvent } from './FilterPopover.types';

import { FilterInputs } from '../filters/FilterInputs';
import { styles } from './FilterPopover.stylex';
import { getOperatorFromFilter } from './utils';

export const FilterPopover = <TData,>({
  columnKey,
  popoverId,
}: FilterPopoverProps<TData>) => {
  useRenderTracker({ componentName: `FilterPopover:${columnKey}` });

  const column = useGetNormalizedColumn<TData>(columnKey);
  const columnFilters = useGetColumnFilters();

  const { dataType, fetchFilterOptions, filterOptions } = column;
  const filter = columnFilters[columnKey];

  const resetColumnFilter = useResetColumnFilter();
  const setColumnFilter = useSetColumnFilter();

  const popoverRef = useRef<HTMLDivElement>(null);

  // Ref to always access latest filter value (avoids stale closure in toggle handler)
  const filterRef = useRef(filter);
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  // Local state to track the current filter value before applying
  // Reset imperatively on popover open, not via effect
  const [localFilter, setLocalFilter] = useState(filter);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Determine if column supports options (from static config or async fetch)
  const hasOptions = Boolean(filterOptions) || Boolean(fetchFilterOptions);

  // Determine if the select list is visible (needed for positioning recalculation)
  const currentOperator = getOperatorFromFilter(localFilter);
  const isListShowing =
    dataType === 'string' &&
    hasOptions &&
    (currentOperator === 'equals' || currentOperator === 'notEquals');

  // Use positioning hook - recalculate when content type changes (operator switch)
  const { resetPositioning } = usePopoverPositioning({
    columnDataType: dataType,
    hasOptions,
    isOpen: isPopoverOpen,
    popoverId,
    popoverRef,
    recalculateDeps: [isListShowing],
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
  }, [resetPositioning]);

  const handleClear = () => {
    setLocalFilter(undefined);
    resetColumnFilter(column.key);
    popoverRef.current?.hidePopover();
  };

  const handleApply = () => {
    setColumnFilter({ columnKey: column.key, filter: localFilter });
    popoverRef.current?.hidePopover();
  };

  const handleClose = () => {
    // Reset local filter to current applied filter when closing without applying
    setLocalFilter(filter);

    popoverRef.current?.hidePopover();
  };

  // Fixed heights for both use cases
  // 25rem: When list is visible (string column with options AND operator is equals/notEquals)
  // 12rem: All other cases (no list)
  const popoverMinHeight = isListShowing ? '25rem' : '12rem';

  return (
    <div
      id={popoverId}
      popover='auto'
      ref={popoverRef}
      {...stylex.props(styles.popover(popoverMinHeight))}
    >
      <div {...stylex.props(styles.content)}>
        <div {...stylex.props(styles.header)}>
          <p {...stylex.props(styles.title)}>Filter: {column.label}</p>
          <button
            aria-label='Close filter'
            onClick={handleClose}
            type='button'
            {...stylex.props(styles.closeButton)}
          >
            <MenuCloseIcon size={16} />
          </button>
        </div>
        <div {...stylex.props(styles.body)}>
          <FilterInputs
            columnKey={columnKey}
            filter={localFilter}
            listMaxHeight='10rem'
            onChange={setLocalFilter}
          />
        </div>
        <div {...stylex.props(styles.footer)}>
          <Button color='primary' onClick={handleApply} size='sm' width='full'>
            Apply
          </Button>
          <Button color='outline' onClick={handleClear} size='sm' width='full'>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};
