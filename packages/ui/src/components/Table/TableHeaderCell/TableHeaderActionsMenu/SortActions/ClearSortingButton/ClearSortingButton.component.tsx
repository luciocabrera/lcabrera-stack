import { Button } from '@repo/ui/components/Button';
import { EraserIcon } from '@repo/ui/components/Icons';
import { useSetColumnSorting } from '@repo/ui/components/Table/contexts/TableConfig/columns/actions';
import { tableActionsPopoverStyles } from '@repo/ui/components/Table/TableActionsPopover';
import * as stylex from '@stylexjs/stylex';

import type { ClearSortingButtonProps } from './ClearSortingButton.types';

/**
 * "Clear Sorting" item of the sorting section: always shown to keep the menu
 * layout stable, but disabled until a direction is applied. Removes the sort
 * and closes the menu via `onClose`.
 */
export const ClearSortingButton = <TData,>({
  columnKey,
  onClose,
  sortDirection,
}: ClearSortingButtonProps<TData>) => {
  const setSorting = useSetColumnSorting<TData>();

  const handleClearSorting = () => {
    setSorting({ columnKey, direction: undefined });
    onClose();
  };

  return (
    <Button
      variant='ghost'
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <EraserIcon size={16} />
        </span>
      }
      isDisabled={sortDirection === undefined}
      onClick={handleClearSorting}
      orientation='horizontal'
      size='mini'
    >
      Clear Sorting
    </Button>
  );
};
