import { Button } from '@repo/ui/components/Button';
import { PinRightIcon } from '@repo/ui/components/Icons';
import { useSetColumnPinning } from '@repo/ui/components/Table/contexts/TableConfig/columns/actions';
import { tableActionsPopoverStyles } from '@repo/ui/components/Table/TableActionsPopover';
import * as stylex from '@stylexjs/stylex';

import type { PinRightButtonProps } from './PinRightButton.types';

/**
 * "Pin Right" item of the pin/hide section: toggles right pinning on/off and
 * highlights itself (via the `primary` variant + `aria-pressed`) while pinned
 * right. Closes the menu via `onClose`.
 */
export const PinRightButton = <TData,>({
  columnKey,
  onClose,
  pinSide,
}: PinRightButtonProps<TData>) => {
  const setColumnPinning = useSetColumnPinning<TData>();
  const isPinnedRight = pinSide === 'right';

  const handlePinRight = () => {
    setColumnPinning({ columnKey, side: isPinnedRight ? undefined : 'right' });
    onClose();
  };

  return (
    <Button
      aria-pressed={isPinnedRight}
      color={isPinnedRight ? 'primary' : 'ghost'}
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <PinRightIcon size={16} />
        </span>
      }
      onClick={handlePinRight}
      orientation='horizontal'
      size='mini'
    >
      Pin Right
    </Button>
  );
};
