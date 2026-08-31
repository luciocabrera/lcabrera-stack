import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { EXPAND_ALL_GROUPS_COMMAND } from '#ui/components/Table/commands';
import { useTableGroupFoldAll } from '#ui/components/Table/hooks';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';

import type { ExpandAllGroupsButtonProps } from './ExpandAllGroupsButton.types';

export const ExpandAllGroupsButton = ({
  onClose,
}: ExpandAllGroupsButtonProps) => {
  const { isExpandAllEnabled, setAllGroupsExpanded } = useTableGroupFoldAll();
  const { icon: ExpandAllGroupsCommandIcon, label } = EXPAND_ALL_GROUPS_COMMAND;

  const handleExpandAll = () => {
    setAllGroupsExpanded(true);
    onClose();
  };

  return (
    <Button
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <ExpandAllGroupsCommandIcon size={16} />
        </span>
      }
      isDisabled={!isExpandAllEnabled}
      onClick={handleExpandAll}
      orientation='horizontal'
      size='mini'
      variant='ghost'
    >
      {label}
    </Button>
  );
};
