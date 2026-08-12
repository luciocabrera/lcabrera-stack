import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { EyeOffIcon } from '#ui/components/Icons';
import { useSetColumnVisibility } from '#ui/components/Table/contexts/TableConfig/columns/actions';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';

import type { HideColumnButtonProps } from './HideColumnButton.types';

/**
 * "Hide Column" item of the pin/hide section: hides the column at table level
 * via `useSetColumnVisibility`. Closes the menu via `onClose`.
 */
export const HideColumnButton = <TData,>({
  columnKey,
  onClose,
}: HideColumnButtonProps<TData>) => {
  const setColumnVisibility = useSetColumnVisibility<TData>();

  const handleHideColumn = () => {
    setColumnVisibility({ columnKey, isVisible: false });
    onClose();
  };

  return (
    <Button
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <EyeOffIcon size={16} />
        </span>
      }
      onClick={handleHideColumn}
      orientation='horizontal'
      size='mini'
      variant='ghost'
    >
      Hide Column
    </Button>
  );
};
