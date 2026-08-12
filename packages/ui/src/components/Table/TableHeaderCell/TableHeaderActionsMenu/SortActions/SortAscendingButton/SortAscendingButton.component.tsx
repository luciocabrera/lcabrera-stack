import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  deriveToggleCommandState,
  SORT_ASCENDING_COMMAND,
} from '#ui/components/Table/commands';
import { useSetColumnSorting } from '#ui/components/Table/contexts/TableConfig/columns/actions';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';

import type { SortAscendingButtonProps } from './SortAscendingButton.types';

/**
 * "Ascending" item of the sorting section: toggles ascending sort on/off and
 * highlights itself (via the `primary` variant + `aria-pressed`) while it is
 * the applied direction. Closes the menu via `onClose`. Identity and
 * active-state come from the shared `SORT_ASCENDING_COMMAND` (ADR-011); this
 * surface owns only its live commit-context and menu presentation.
 */
export const SortAscendingButton = <TData,>({
  columnKey,
  onClose,
  sortDirection,
}: SortAscendingButtonProps<TData>) => {
  const setSorting = useSetColumnSorting<TData>();
  const { icon: SortAscendingCommandIcon, label } = SORT_ASCENDING_COMMAND;
  const { isActive } = deriveToggleCommandState({
    current: sortDirection,
    isDisabled: false,
    target: 'asc',
  });

  const handleAscending = () => {
    setSorting({ columnKey, direction: isActive ? undefined : 'asc' });
    onClose();
  };

  return (
    <Button
      aria-pressed={isActive}
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <SortAscendingCommandIcon size={16} />
        </span>
      }
      onClick={handleAscending}
      orientation='horizontal'
      size='mini'
      variant={isActive ? 'primary' : 'ghost'}
    >
      {label}
    </Button>
  );
};
