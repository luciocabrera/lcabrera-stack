import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  CLEAR_GROUPING_COMMAND,
  deriveToggleCommandState,
} from '#ui/components/Table/commands';
import { useClearTableGrouping } from '#ui/components/Table/contexts/TableConfig/grouping/actions';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { useGetTableIsGroupingEnabled } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';

import type { ClearGroupingButtonProps } from './ClearGroupingButton.types';

/**
 * "Clear Grouping" item of the grouping section: always shown to keep the menu
 * layout stable, disabled until some column is grouped. It clears every applied
 * key and every selected aggregate, not only the column whose menu is open —
 * grouping is one whole-table state, so an ungrouped column's menu can still
 * switch it off.
 *
 * **It takes no `columnKey`, and that is the point.** Its sibling
 * `GroupByColumnButton` gates on the open column's `isGroupable`, which is
 * correct for it: it groups *by that column*, so that column's capability is
 * exactly the question being asked. Clearing asks nothing about any column. The
 * two look symmetric and are not, so the difference is enforced structurally
 * rather than by comment — there is no column in scope here to gate on by
 * mistake, which is how the previous version of this file came to contradict
 * the paragraph above.
 *
 * What can disable it is the route's own capability, so that is what
 * `isDisabled` reads. The rest follows from `current`, which is where
 * `deriveToggleCommandState` already answers "is there anything to clear".
 */
export const ClearGroupingButton = ({ onClose }: ClearGroupingButtonProps) => {
  const clearGrouping = useClearTableGrouping();
  const groupingKeys = useGetTableGroupingKeys();
  const isGroupingEnabled = useGetTableIsGroupingEnabled();
  const { icon: ClearGroupingCommandIcon, label } = CLEAR_GROUPING_COMMAND;
  const { isEnabled } = deriveToggleCommandState({
    current: groupingKeys[0],
    isDisabled: !isGroupingEnabled,
    target: undefined,
  });

  const handleClearGrouping = () => {
    clearGrouping();
    onClose();
  };

  return (
    <Button
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <ClearGroupingCommandIcon size={16} />
        </span>
      }
      isDisabled={!isEnabled}
      onClick={handleClearGrouping}
      orientation='horizontal'
      size='mini'
      variant='ghost'
    >
      {label}
    </Button>
  );
};
