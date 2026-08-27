import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { COLLAPSE_GROUP_LEVEL_COMMAND } from '#ui/components/Table/commands';
import { useTableGroupLevelFold } from '#ui/components/Table/hooks';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';

import type { CollapseGroupLevelButtonProps } from './CollapseGroupLevelButton.types';

/**
 * "Collapse This Level" item: folds the groups one level above this column, which is what
 * takes the values the column states off the grid and leaves every outer level standing.
 * Disabled once every group at that level is already folded — the same predicate the
 * action's early return uses, so a disabled item and a click that does nothing agree.
 */
export const CollapseGroupLevelButton = ({
  columnKey,
  onClose,
}: CollapseGroupLevelButtonProps) => {
  const { isCollapseLevelEnabled, setGroupLevelExpanded } =
    useTableGroupLevelFold(columnKey);
  const { icon: CollapseGroupLevelCommandIcon, label } =
    COLLAPSE_GROUP_LEVEL_COMMAND;

  const handleCollapseLevel = () => {
    setGroupLevelExpanded({ columnKey, isExpanded: false });
    onClose();
  };

  return (
    <Button
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <CollapseGroupLevelCommandIcon size={16} />
        </span>
      }
      isDisabled={!isCollapseLevelEnabled}
      onClick={handleCollapseLevel}
      orientation='horizontal'
      size='mini'
      variant='ghost'
    >
      {label}
    </Button>
  );
};
