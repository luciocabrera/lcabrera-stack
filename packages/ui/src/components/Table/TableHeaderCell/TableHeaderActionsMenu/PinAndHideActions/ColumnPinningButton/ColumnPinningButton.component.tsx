import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { deriveToggleCommandState } from '#ui/components/Table/commands';
import { useSetColumnPinning } from '#ui/components/Table/contexts/TableConfig/columns/actions';
import { useGetNormalizedColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';
import { resolveColumnPinningTitle } from '#ui/components/Table/utils/resolveColumnPinningTitle.util';

import type { ColumnPinningButtonProps } from './ColumnPinningButton.types';

import { COLUMN_PINNING_TARGETS } from './ColumnPinningButton.constants';

export const ColumnPinningButton = <TData,>({
  columnKey,
  layoutLock,
  onClose,
  pinSide,
  target,
}: ColumnPinningButtonProps<TData>) => {
  const setColumnPinning = useSetColumnPinning<TData>();
  const column = useGetNormalizedColumn<TData>(columnKey);
  const { isStatic } = resolveColumnCapabilities(column);
  const {
    command: { icon: CommandIcon, label },
    side,
  } = COLUMN_PINNING_TARGETS[target];
  const { isActive, isEnabled } = deriveToggleCommandState<'left' | 'right'>({
    current: pinSide,
    isDisabled: isStatic || layoutLock === 'group-key',
    target: side,
  });

  const title = resolveColumnPinningTitle(layoutLock);

  const handleClick = () => {
    setColumnPinning({ columnKey, side: isActive ? undefined : side });
    onClose();
  };

  return (
    <Button
      {...(side !== undefined && { 'aria-pressed': isActive })}
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <CommandIcon size={16} />
        </span>
      }
      isDisabled={!isEnabled}
      {...(title !== undefined && { title })}
      onClick={handleClick}
      orientation='horizontal'
      size='mini'
      variant={isActive ? 'primary' : 'ghost'}
    >
      {label}
    </Button>
  );
};
