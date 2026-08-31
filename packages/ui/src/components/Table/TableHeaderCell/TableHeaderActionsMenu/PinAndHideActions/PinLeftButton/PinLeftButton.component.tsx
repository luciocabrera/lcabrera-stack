import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  deriveToggleCommandState,
  PIN_LEFT_COMMAND,
} from '#ui/components/Table/commands';
import { useSetColumnPinning } from '#ui/components/Table/contexts/TableConfig/columns/actions';
import { useGetNormalizedColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { TABLE_COLUMN_LAYOUT_LOCK_LABELS } from '#ui/components/Table/Table.constants';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

import type { PinLeftButtonProps } from './PinLeftButton.types';

export const PinLeftButton = <TData,>({
  columnKey,
  layoutLock,
  onClose,
  pinSide,
}: PinLeftButtonProps<TData>) => {
  const setColumnPinning = useSetColumnPinning<TData>();
  const column = useGetNormalizedColumn<TData>(columnKey);
  const { isStatic } = resolveColumnCapabilities(column);
  const { icon: PinLeftCommandIcon, label } = PIN_LEFT_COMMAND;
  const { isActive, isEnabled } = deriveToggleCommandState({
    current: pinSide,
    isDisabled: isStatic || layoutLock !== undefined,
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
      isDisabled={!isEnabled}
      {...(layoutLock !== undefined && {
        title: `Cannot pin this column: ${TABLE_COLUMN_LAYOUT_LOCK_LABELS[layoutLock]}.`,
      })}
      onClick={handlePinLeft}
      orientation='horizontal'
      size='mini'
      variant={isActive ? 'primary' : 'ghost'}
    >
      {label}
    </Button>
  );
};
