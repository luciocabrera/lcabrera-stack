import { Button } from '@lcabrera/ui/components/Button';
import {
  deriveToggleCommandState,
  PIN_RIGHT_COMMAND,
} from '@lcabrera/ui/components/Table/commands';
import { useSetColumnPinning } from '@lcabrera/ui/components/Table/contexts/TableConfig/columns/actions';
import { tableActionsPopoverStyles } from '@lcabrera/ui/components/Table/TableActionsPopover';
import * as stylex from '@stylexjs/stylex';

import type { PinRightButtonProps } from './PinRightButton.types';

/**
 * "Pin Right" item of the pin/hide section: toggles right pinning on/off and
 * highlights itself (via the `primary` variant + `aria-pressed`) while pinned
 * right. Closes the menu via `onClose`. Identity and active-state come from the
 * shared `PIN_RIGHT_COMMAND` (ADR-011); this surface owns only its live
 * commit-context and menu presentation.
 */
export const PinRightButton = <TData,>({
  columnKey,
  onClose,
  pinSide,
}: PinRightButtonProps<TData>) => {
  const setColumnPinning = useSetColumnPinning<TData>();
  const { icon: PinRightCommandIcon, label } = PIN_RIGHT_COMMAND;
  const { isActive } = deriveToggleCommandState({
    current: pinSide,
    isDisabled: false,
    target: 'right',
  });

  const handlePinRight = () => {
    setColumnPinning({ columnKey, side: isActive ? undefined : 'right' });
    onClose();
  };

  return (
    <Button
      aria-pressed={isActive}
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <PinRightCommandIcon size={16} />
        </span>
      }
      onClick={handlePinRight}
      orientation='horizontal'
      size='mini'
      variant={isActive ? 'primary' : 'ghost'}
    >
      {label}
    </Button>
  );
};
