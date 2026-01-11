import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef, useState } from 'react';

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
  filter,
  filterOptions,
  onApply,
  onClear,
  popoverId,
}: FilterPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  // Local state to track the current filter value before applying
  const [localFilter, setLocalFilter] = useState(filter);

  // Sync local filter with prop when it changes externally
  useEffect(() => {
    setLocalFilter(filter);
  }, [filter]);

  // Handle popover toggle events
  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;

    const handlePopoverToggle = (e: Event) => {
      const toggleEvent = e as ToggleEvent;
      if (toggleEvent.newState === 'open') {
        // Focus first input when popover opens
        const firstInput = popover.querySelector('input, select');
        if (firstInput) {
          setTimeout(() => {
            (firstInput as HTMLElement).focus();
          }, 0);
        }
      }
    };

    popover.addEventListener('toggle', handlePopoverToggle);
    return () => {
      popover.removeEventListener('toggle', handlePopoverToggle);
    };
  }, []);

  const renderFilterInput = () => {
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
        if (filterOptions && filterOptions.length > 0) {
          return (
            <SelectFilterInput
              // eslint-disable-next-line unicorn/no-null
              filter={localFilter?.type === 'select' ? localFilter : null}
              onChange={setLocalFilter}
              options={filterOptions}
            />
          );
        }
        // Otherwise use TextFilterInput
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
            // @ts-expect-error - stylex types issue
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
          >
            Clear
          </Button>
          <Button
            color='primary'
            onClick={() => {
              console.warn('🎯 [FilterPopover] Apply clicked with localFilter:', localFilter);
              onApply(localFilter);
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore - hidePopover not in TS types yet
              popoverRef.current?.hidePopover();
            }}
            size='sm'
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};
