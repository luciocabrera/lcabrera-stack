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
