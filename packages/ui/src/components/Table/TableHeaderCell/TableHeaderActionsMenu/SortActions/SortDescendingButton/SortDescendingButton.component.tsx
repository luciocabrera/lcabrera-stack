import { Button } from '@repo/ui/components/Button';
import {
  deriveToggleCommandState,
  SORT_DESCENDING_COMMAND,
} from '@repo/ui/components/Table/commands';
import { useSetColumnSorting } from '@repo/ui/components/Table/contexts/TableConfig/columns/actions';
import { tableActionsPopoverStyles } from '@repo/ui/components/Table/TableActionsPopover';
import * as stylex from '@stylexjs/stylex';

import type { SortDescendingButtonProps } from './SortDescendingButton.types';

/**
 * "Descending" item of the sorting section: toggles descending sort on/off and
 * highlights itself (via the `primary` variant + `aria-pressed`) while it is
 * the applied direction. Closes the menu via `onClose`. Identity and
 * active-state come from the shared `SORT_DESCENDING_COMMAND` (ADR-011); this
 * surface owns only its live commit-context and menu presentation.
 */
export const SortDescendingButton = <TData,>({
  columnKey,
  onClose,
  sortDirection,
}: SortDescendingButtonProps<TData>) => {
  const setSorting = useSetColumnSorting<TData>();
  const { icon: SortDescendingCommandIcon, label } = SORT_DESCENDING_COMMAND;
  const { isActive } = deriveToggleCommandState({
    current: sortDirection,
    isDisabled: false,
    target: 'desc',
  });

  const handleDescending = () => {
    setSorting({ columnKey, direction: isActive ? undefined : 'desc' });
    onClose();
  };

  return (
    <Button
      aria-pressed={isActive}
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <SortDescendingCommandIcon size={16} />
        </span>
      }
      onClick={handleDescending}
      orientation='horizontal'
      size='mini'
      variant={isActive ? 'primary' : 'ghost'}
    >
      {label}
    </Button>
  );
};
