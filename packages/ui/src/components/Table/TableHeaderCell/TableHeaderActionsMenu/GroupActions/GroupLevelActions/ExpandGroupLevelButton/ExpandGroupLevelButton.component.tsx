import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { EXPAND_GROUP_LEVEL_COMMAND } from '#ui/components/Table/commands';
import { useTableGroupLevelFold } from '#ui/components/Table/hooks';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';

import type { ExpandGroupLevelButtonProps } from './ExpandGroupLevelButton.types';

/**
 * "Expand This Level" item: reopens the groups this column's level was folded into,
 * disabled while none of them is folded.
 * Every path outside that level is left as it is, so a level opened here does not reopen
 * one the reader closed themselves.
 */
export const ExpandGroupLevelButton = ({
  columnKey,
  onClose,
}: ExpandGroupLevelButtonProps) => {
  const { isExpandLevelEnabled, setGroupLevelExpanded } =
    useTableGroupLevelFold(columnKey);
  const { icon: ExpandGroupLevelCommandIcon, label } =
    EXPAND_GROUP_LEVEL_COMMAND;

  const handleExpandLevel = () => {
    setGroupLevelExpanded({ columnKey, isExpanded: true });
    onClose();
  };

  return (
    <Button
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <ExpandGroupLevelCommandIcon size={16} />
        </span>
      }
      isDisabled={!isExpandLevelEnabled}
      onClick={handleExpandLevel}
      orientation='horizontal'
      size='mini'
      variant='ghost'
    >
      {label}
    </Button>
  );
};
