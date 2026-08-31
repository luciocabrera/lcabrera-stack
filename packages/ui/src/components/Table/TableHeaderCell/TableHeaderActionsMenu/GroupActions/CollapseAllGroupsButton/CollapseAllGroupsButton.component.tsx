import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { COLLAPSE_ALL_GROUPS_COMMAND } from '#ui/components/Table/commands';
import { useTableGroupFoldAll } from '#ui/components/Table/hooks';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';

import type { CollapseAllGroupsButtonProps } from './CollapseAllGroupsButton.types';

export const CollapseAllGroupsButton = ({
  onClose,
}: CollapseAllGroupsButtonProps) => {
  const { isCollapseAllEnabled, setAllGroupsExpanded } = useTableGroupFoldAll();
  const { icon: CollapseAllGroupsCommandIcon, label } =
    COLLAPSE_ALL_GROUPS_COMMAND;

  const handleCollapseAll = () => {
    setAllGroupsExpanded(false);
    onClose();
  };

  return (
    <Button
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <CollapseAllGroupsCommandIcon size={16} />
        </span>
      }
      isDisabled={!isCollapseAllEnabled}
      onClick={handleCollapseAll}
      orientation='horizontal'
      size='mini'
      variant='ghost'
    >
      {label}
    </Button>
  );
};
