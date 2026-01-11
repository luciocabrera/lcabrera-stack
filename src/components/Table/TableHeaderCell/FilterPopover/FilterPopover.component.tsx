import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/Button';

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
            filter={filter?.type === 'boolean' ? filter : null}
            onChange={onApply}
          />
        );
      }
      case 'currency':
      case 'number': {
        return (
          <NumberFilterInput
            // eslint-disable-next-line unicorn/no-null
            filter={filter?.type === 'number' ? filter : null}
            onChange={onApply}
          />
        );
      }
      case 'date': {
        return (
          <DateFilterInput
            // eslint-disable-next-line unicorn/no-null
            filter={filter?.type === 'date' ? filter : null}
            onChange={onApply}
          />
        );
      }
      case 'string': {
        // Use SelectFilterInput if we have filter options (facet filter)
        if (filterOptions && filterOptions.length > 0) {
          return (
            <SelectFilterInput
              // eslint-disable-next-line unicorn/no-null
              filter={filter?.type === 'select' ? filter : null}
              onChange={onApply}
              options={filterOptions}
            />
          );
        }
        // Otherwise use TextFilterInput
        return (
          <TextFilterInput
            // eslint-disable-next-line unicorn/no-null
            filter={filter?.type === 'text' ? filter : null}
            onChange={onApply}
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
        </div>
        <div {...stylex.props(styles.body)}>{renderFilterInput()}</div>
        <div {...stylex.props(styles.footer)}>
          <Button
            color='outline'
            onClick={() => {
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
