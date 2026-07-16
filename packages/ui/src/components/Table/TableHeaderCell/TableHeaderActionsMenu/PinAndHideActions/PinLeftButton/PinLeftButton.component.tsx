import { Button } from '@repo/ui/components/Button';
import { PinLeftIcon } from '@repo/ui/components/Icons';
import { useSetColumnPinning } from '@repo/ui/components/Table/contexts/TableConfig/columns/actions';
import { tableActionsPopoverStyles } from '@repo/ui/components/Table/TableActionsPopover';
import * as stylex from '@stylexjs/stylex';

import type { PinLeftButtonProps } from './PinLeftButton.types';

/**
 * "Pin Left" item of the pin/hide section: toggles left pinning on/off and
 * highlights itself (via the `primary` variant + `aria-pressed`) while pinned
 * left. Carries the section divider above it when `hasSectionAbove` is set.
 * Closes the menu via `onClose`.
 */
export const PinLeftButton = <TData,>({
  columnKey,
  hasSectionAbove = false,
  onClose,
  pinSide,
}: PinLeftButtonProps<TData>) => {
  const setColumnPinning = useSetColumnPinning<TData>();
  const isPinnedLeft = pinSide === 'left';

  const handlePinLeft = () => {
    setColumnPinning({ columnKey, side: isPinnedLeft ? undefined : 'left' });
    onClose();
  };

  return (
    <Button
      aria-pressed={isPinnedLeft}
      customStylex={[
        tableActionsPopoverStyles.menuItem,
        hasSectionAbove && tableActionsPopoverStyles.menuSectionDivider,
      ]}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <PinLeftIcon size={16} />
        </span>
      }
      onClick={handlePinLeft}
      orientation='horizontal'
      size='mini'
      variant={isPinnedLeft ? 'primary' : 'ghost'}
    >
      Pin Left
    </Button>
  );
};
