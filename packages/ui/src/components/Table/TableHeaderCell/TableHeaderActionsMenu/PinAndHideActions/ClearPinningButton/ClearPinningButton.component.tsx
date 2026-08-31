import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  CLEAR_PINNING_COMMAND,
  deriveToggleCommandState,
} from '#ui/components/Table/commands';
import { useSetColumnPinning } from '#ui/components/Table/contexts/TableConfig/columns/actions';
import { useGetNormalizedColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { TABLE_COLUMN_LAYOUT_LOCK_LABELS } from '#ui/components/Table/Table.constants';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

import type { ClearPinningButtonProps } from './ClearPinningButton.types';

/**
 * Identity and enabled-state come from the shared `CLEAR_PINNING_COMMAND` (ADR-011); this
 * surface owns only its live commit-context and menu presentation.
 */
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
    isDisabled: isStatic || layoutLock !== undefined,
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
      {...(layoutLock !== undefined && {
        title: `Cannot pin this column: ${TABLE_COLUMN_LAYOUT_LOCK_LABELS[layoutLock]}.`,
      })}
      onClick={handleClearPinning}
      orientation='horizontal'
      size='mini'
      variant='ghost'
    >
      {label}
    </Button>
  );
};
