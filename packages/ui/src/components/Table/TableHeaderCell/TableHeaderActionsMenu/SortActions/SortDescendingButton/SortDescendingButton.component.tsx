import { Button } from '@repo/ui/components/Button';
import { SortDescIcon } from '@repo/ui/components/Icons';
import { useSetColumnSorting } from '@repo/ui/components/Table/contexts/TableConfig/columns/actions';
import { tableActionsPopoverStyles } from '@repo/ui/components/Table/TableActionsPopover';
import * as stylex from '@stylexjs/stylex';

import type { SortDescendingButtonProps } from './SortDescendingButton.types';

/**
 * "Descending" item of the sorting section: toggles descending sort on/off and
 * highlights itself (via the `primary` variant + `aria-pressed`) while it is
 * the applied direction. Closes the menu via `onClose`.
 */
export const SortDescendingButton = <TData,>({
  columnKey,
  onClose,
  sortDirection,
}: SortDescendingButtonProps<TData>) => {
  const setSorting = useSetColumnSorting<TData>();
  const isDescending = sortDirection === 'desc';

  const handleDescending = () => {
    setSorting({ columnKey, direction: isDescending ? undefined : 'desc' });
    onClose();
  };

  return (
    <Button
      aria-pressed={isDescending}
      variant={isDescending ? 'primary' : 'ghost'}
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <SortDescIcon size={16} />
        </span>
      }
      onClick={handleDescending}
      orientation='horizontal'
      size='mini'
    >
      Descending
    </Button>
  );
};
