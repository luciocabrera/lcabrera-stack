import { Button } from '@repo/ui/components/Button';
import {
  CLEAR_SORTING_COMMAND,
  deriveToggleCommandState,
} from '@repo/ui/components/Table/commands';
import { useSetColumnSorting } from '@repo/ui/components/Table/contexts/TableConfig/columns/actions';
import { tableActionsPopoverStyles } from '@repo/ui/components/Table/TableActionsPopover';
import * as stylex from '@stylexjs/stylex';

import type { ClearSortingButtonProps } from './ClearSortingButton.types';

/**
 * "Clear Sorting" item of the sorting section: always shown to keep the menu
 * layout stable, but disabled until a direction is applied. Removes the sort and
 * closes the menu via `onClose`. Identity and enabled-state come from the shared
 * `CLEAR_SORTING_COMMAND` (ADR-011); this surface owns only its live
 * commit-context and menu presentation.
 */
export const ClearSortingButton = <TData,>({
  columnKey,
  onClose,
  sortDirection,
}: ClearSortingButtonProps<TData>) => {
  const setSorting = useSetColumnSorting<TData>();
  const { icon: ClearSortingCommandIcon, label } = CLEAR_SORTING_COMMAND;
  const { isEnabled } = deriveToggleCommandState({
    current: sortDirection,
    isDisabled: false,
    target: undefined,
  });

  const handleClearSorting = () => {
    setSorting({ columnKey, direction: undefined });
    onClose();
  };

  return (
    <Button
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <ClearSortingCommandIcon size={16} />
        </span>
      }
      isDisabled={!isEnabled}
      onClick={handleClearSorting}
      orientation='horizontal'
      size='mini'
      variant='ghost'
    >
      {label}
    </Button>
  );
};
