import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  CLEAR_PINNING_COMMAND,
  deriveToggleCommandState,
} from '#ui/components/Table/commands';
import { useSetColumnPinning } from '#ui/components/Table/contexts/TableConfig/columns/actions';
import { useGetNormalizedColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';
import { resolveColumnPinningTitle } from '#ui/components/Table/utils/resolveColumnPinningTitle.util';

import type { ClearPinningButtonProps } from './ClearPinningButton.types';

export const ClearPinningButton = <TData,>({
  columnKey,
  layoutLock,
  onClose,
  pinSide,
}: ClearPinningButtonProps<TData>) => {
  const setColumnPinning = useSetColumnPinning<TData>();
  const column = useGetNormalizedColumn<TData>(columnKey);
  const { isStatic } = resolveColumnCapabilities(column);
  const { icon: ClearPinningCommandIcon, label } = CLEAR_PINNING_COMMAND;
  const { isEnabled } = deriveToggleCommandState({
    current: pinSide,
    isDisabled: isStatic || layoutLock === 'group-key',
    target: undefined,
  });

  const title = resolveColumnPinningTitle(layoutLock);

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
      {...(title !== undefined && { title })}
      onClick={handleClearPinning}
      orientation='horizontal'
      size='mini'
      variant='ghost'
    >
      {label}
    </Button>
  );
};
