import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  CLEAR_GROUPING_COMMAND,
  deriveToggleCommandState,
} from '#ui/components/Table/commands';
import { useClearTableGrouping } from '#ui/components/Table/contexts/TableConfig/grouping/actions';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import {
  useGetTableIsGroupingEnabled,
  useGetTableIsGroupingLocked,
} from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';

import type { ClearGroupingButtonProps } from './ClearGroupingButton.types';

/**
 * "Clear Grouping" item of the grouping section: always shown to keep the menu layout
 * stable, disabled until some column is grouped.
 * It clears every applied key and every selected aggregate, not only the column whose menu
 * is open — grouping is one whole-table state, so an ungrouped column's menu can still
 * switch it off.
 */
export const ClearGroupingButton = ({ onClose }: ClearGroupingButtonProps) => {
  const clearGrouping = useClearTableGrouping();
  const groupingKeys = useGetTableGroupingKeys();
  const isGroupingEnabled = useGetTableIsGroupingEnabled();
  const isGroupingLocked = useGetTableIsGroupingLocked();
  const { icon: ClearGroupingCommandIcon, label } = CLEAR_GROUPING_COMMAND;
  const { isEnabled } = deriveToggleCommandState({
    current: groupingKeys[0],
    isDisabled: !isGroupingEnabled,
    target: undefined,
  });

  // The one exception to "always shown to keep the menu layout stable" above: a
  // locked grouping has nothing to clear *to*, and an item permanently disabled
  // for a reason the user cannot act on is worse than an absent one (#578).
  if (isGroupingLocked) return;

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
