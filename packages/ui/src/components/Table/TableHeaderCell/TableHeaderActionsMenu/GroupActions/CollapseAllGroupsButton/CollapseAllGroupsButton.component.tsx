import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { COLLAPSE_ALL_GROUPS_COMMAND } from '#ui/components/Table/commands';
import { useTableGroupFoldAll } from '#ui/components/Table/hooks';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';

import type { CollapseAllGroupsButtonProps } from './CollapseAllGroupsButton.types';

/**
 * "Collapse All Groups" item of the grouping section: always shown to keep the
 * menu layout stable, disabled while every foldable group is already folded.
 *
 * It folds to the **outermost** level rather than to nothing — the top-level
 * groups and the grand total are nobody's parent, so they stay on screen and
 * there is something left to expand from (#774).
 */
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
