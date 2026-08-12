import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  CLEAR_GROUPING_COMMAND,
  deriveToggleCommandState,
} from '#ui/components/Table/commands';
import { useGetNormalizedColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useSetTableGrouping } from '#ui/components/Table/contexts/TableConfig/grouping/actions';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

import type { ClearGroupingButtonProps } from './ClearGroupingButton.types';

/**
 * "Clear Grouping" item of the grouping section: always shown to keep the menu
 * layout stable, disabled until some column is grouped. It clears whatever key
 * is applied, not necessarily this column's — grouping is one whole-table
 * state, so an ungrouped column's menu can still switch it off.
 */
export const ClearGroupingButton = <TData,>({
  columnKey,
  onClose,
}: ClearGroupingButtonProps<TData>) => {
  const setGrouping = useSetTableGrouping();
  const groupingKeys = useGetTableGroupingKeys();
  const column = useGetNormalizedColumn<TData>(columnKey);
  const { isGroupable } = resolveColumnCapabilities(column);
  const { icon: ClearGroupingCommandIcon, label } = CLEAR_GROUPING_COMMAND;
  const { isEnabled } = deriveToggleCommandState({
    current: groupingKeys[0],
    isDisabled: !isGroupable,
    target: undefined,
  });

  const handleClearGrouping = () => {
    setGrouping(undefined);
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
