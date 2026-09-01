import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  deriveToggleCommandState,
  PIN_RIGHT_COMMAND,
} from '#ui/components/Table/commands';
import { useSetColumnPinning } from '#ui/components/Table/contexts/TableConfig/columns/actions';
import { useGetNormalizedColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';
import { resolveColumnPinningTitle } from '#ui/components/Table/utils/resolveColumnPinningTitle.util';

import type { PinRightButtonProps } from './PinRightButton.types';

export const PinRightButton = <TData,>({
  columnKey,
  layoutLock,
  onClose,
  pinSide,
}: PinRightButtonProps<TData>) => {
  const setColumnPinning = useSetColumnPinning<TData>();
  const column = useGetNormalizedColumn<TData>(columnKey);
  const { isStatic } = resolveColumnCapabilities(column);
  const { icon: PinRightCommandIcon, label } = PIN_RIGHT_COMMAND;
  const { isActive, isEnabled } = deriveToggleCommandState({
    current: pinSide,
    isDisabled: isStatic || layoutLock === 'group-key',
    target: 'right',
  });

  const title = resolveColumnPinningTitle(layoutLock);

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
      isDisabled={!isEnabled}
      {...(title !== undefined && { title })}
      onClick={handlePinRight}
      orientation='horizontal'
      size='mini'
      variant={isActive ? 'primary' : 'ghost'}
    >
      {label}
    </Button>
  );
};
