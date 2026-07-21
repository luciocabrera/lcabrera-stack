import { Button } from '@lcabrera/ui/components/Button';
import {
  CLEAR_PINNING_COMMAND,
  deriveToggleCommandState,
} from '@lcabrera/ui/components/Table/commands';
import { useSetColumnPinning } from '@lcabrera/ui/components/Table/contexts/TableConfig/columns/actions';
import { tableActionsPopoverStyles } from '@lcabrera/ui/components/Table/TableActionsPopover';
import * as stylex from '@stylexjs/stylex';

import type { ClearPinningButtonProps } from './ClearPinningButton.types';

/**
 * "Clear Pinning" item of the pin/hide section: always shown to keep the menu
 * layout stable, but disabled until a side is pinned. Unpins the column and
 * closes the menu via `onClose`. Identity and enabled-state come from the shared
 * `CLEAR_PINNING_COMMAND` (ADR-011); this surface owns only its live
 * commit-context and menu presentation.
 */
export const ClearPinningButton = <TData,>({
  columnKey,
  onClose,
  pinSide,
}: ClearPinningButtonProps<TData>) => {
  const setColumnPinning = useSetColumnPinning<TData>();
  const { icon: ClearPinningCommandIcon, label } = CLEAR_PINNING_COMMAND;
  const { isEnabled } = deriveToggleCommandState({
    current: pinSide,
    isDisabled: false,
    target: undefined,
  });

  const handleClearPinning = () => {
    setColumnPinning({ columnKey, side: undefined });
    onClose();
  };

  return (
    <Button
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <ClearPinningCommandIcon size={16} />
        </span>
      }
      isDisabled={!isEnabled}
      onClick={handleClearPinning}
      orientation='horizontal'
      size='mini'
      variant='ghost'
    >
      {label}
    </Button>
  );
};
