import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  deriveToggleCommandState,
  PIN_LEFT_COMMAND,
} from '#ui/components/Table/commands';
import { useSetColumnPinning } from '#ui/components/Table/contexts/TableConfig/columns/actions';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';

import type { PinLeftButtonProps } from './PinLeftButton.types';

/**
 * "Pin Left" item of the pin/hide section: toggles left pinning on/off and
 * highlights itself (via the `primary` variant + `aria-pressed`) while pinned
 * left. Closes the menu via `onClose`. Identity and active-state come from the
 * shared `PIN_LEFT_COMMAND` (ADR-011); this surface owns only its live
 * commit-context and menu presentation.
 */
export const PinLeftButton = <TData,>({
  columnKey,
  onClose,
  pinSide,
}: PinLeftButtonProps<TData>) => {
  const setColumnPinning = useSetColumnPinning<TData>();
  const { icon: PinLeftCommandIcon, label } = PIN_LEFT_COMMAND;
  const { isActive } = deriveToggleCommandState({
    current: pinSide,
    isDisabled: false,
    target: 'left',
  });

  const handlePinLeft = () => {
    setColumnPinning({ columnKey, side: isActive ? undefined : 'left' });
    onClose();
  };

  return (
    <Button
      aria-pressed={isActive}
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <PinLeftCommandIcon size={16} />
        </span>
      }
      onClick={handlePinLeft}
      orientation='horizontal'
      size='mini'
      variant={isActive ? 'primary' : 'ghost'}
    >
      {label}
    </Button>
  );
};
