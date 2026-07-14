import { Button } from '@repo/ui/components/Button';
import { PinOffIcon } from '@repo/ui/components/Icons';
import { useSetColumnPinning } from '@repo/ui/components/Table/contexts/TableConfig/columns/actions';
import { tableActionsPopoverStyles } from '@repo/ui/components/Table/TableActionsPopover';
import * as stylex from '@stylexjs/stylex';

import type { ClearPinningButtonProps } from './ClearPinningButton.types';

/**
 * "Clear Pinning" item of the pin/hide section: always shown to keep the menu
 * layout stable, but disabled until a side is pinned. Unpins the column and
 * closes the menu via `onClose`.
 */
export const ClearPinningButton = <TData,>({
  columnKey,
  onClose,
  pinSide,
}: ClearPinningButtonProps<TData>) => {
  const setColumnPinning = useSetColumnPinning<TData>();

  const handleClearPinning = () => {
    setColumnPinning({ columnKey, side: undefined });
    onClose();
  };

  return (
    <Button
      color='ghost'
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <PinOffIcon size={16} />
        </span>
      }
      isDisabled={pinSide === undefined}
      onClick={handleClearPinning}
      orientation='horizontal'
      size='mini'
    >
      Clear Pinning
    </Button>
  );
};
