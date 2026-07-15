import { Button } from '@repo/ui/components/Button';
import { SortAscIcon } from '@repo/ui/components/Icons';
import { useSetColumnSorting } from '@repo/ui/components/Table/contexts/TableConfig/columns/actions';
import { tableActionsPopoverStyles } from '@repo/ui/components/Table/TableActionsPopover';
import * as stylex from '@stylexjs/stylex';

import type { SortAscendingButtonProps } from './SortAscendingButton.types';

/**
 * "Ascending" item of the sorting section: toggles ascending sort on/off and
 * highlights itself (via the `primary` variant + `aria-pressed`) while it is
 * the applied direction. Closes the menu via `onClose`.
 */
export const SortAscendingButton = <TData,>({
  columnKey,
  onClose,
  sortDirection,
}: SortAscendingButtonProps<TData>) => {
  const setSorting = useSetColumnSorting<TData>();
  const isAscending = sortDirection === 'asc';

  const handleAscending = () => {
    setSorting({ columnKey, direction: isAscending ? undefined : 'asc' });
    onClose();
  };

  return (
    <Button
      aria-pressed={isAscending}
      variant={isAscending ? 'primary' : 'ghost'}
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <SortAscIcon size={16} />
        </span>
      }
      onClick={handleAscending}
      orientation='horizontal'
      size='mini'
    >
      Ascending
    </Button>
  );
};
