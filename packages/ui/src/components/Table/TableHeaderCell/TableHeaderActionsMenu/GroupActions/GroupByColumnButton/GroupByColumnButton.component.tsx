import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  deriveToggleCommandState,
  GROUP_BY_COLUMN_COMMAND,
} from '#ui/components/Table/commands';
import { useGetNormalizedColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useSetTableGrouping } from '#ui/components/Table/contexts/TableConfig/grouping/actions';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

import type { GroupByColumnButtonProps } from './GroupByColumnButton.types';

/**
 * "Group by This" item of the grouping section: applies this column as the
 * group key and highlights itself while it is the applied one, clicking again
 * to clear. A self-connected delegate — it reads the applied key from the
 * grouping store itself rather than being handed it, so no parent drills
 * grouping state through the menu.
 *
 * The applied key is `current` and this column is `target`, which is the same
 * shape sorting passes `deriveToggleCommandState`: one key at a time, so
 * "active" means the table is grouped by exactly this column.
 */
export const GroupByColumnButton = <TData,>({
  columnKey,
  onClose,
}: GroupByColumnButtonProps<TData>) => {
  const setGrouping = useSetTableGrouping();
  const groupingKeys = useGetTableGroupingKeys();
  const column = useGetNormalizedColumn<TData>(columnKey);
  const { isGroupable } = resolveColumnCapabilities(column);
  const { icon: GroupByColumnCommandIcon, label } = GROUP_BY_COLUMN_COMMAND;
  const { isActive, isEnabled } = deriveToggleCommandState({
    current: groupingKeys[0],
    isDisabled: !isGroupable,
    target: String(columnKey),
  });

  const handleGroupByColumn = () => {
    setGrouping(isActive ? undefined : String(columnKey));
    onClose();
  };

  return (
    <Button
      aria-pressed={isActive}
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <GroupByColumnCommandIcon size={16} />
        </span>
      }
      isDisabled={!isEnabled}
      onClick={handleGroupByColumn}
      orientation='horizontal'
      size='mini'
      variant={isActive ? 'primary' : 'ghost'}
    >
      {label}
    </Button>
  );
};
