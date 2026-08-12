import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  deriveToggleCommandState,
  GROUP_BY_COLUMN_COMMAND,
} from '#ui/components/Table/commands';
import { useGetNormalizedColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useToggleTableGroupKey } from '#ui/components/Table/contexts/TableConfig/grouping/actions';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

import type { GroupByColumnButtonProps } from './GroupByColumnButton.types';

/**
 * "Group by This" item of the grouping section: adds this column to the group
 * keys and highlights itself while it is one of them, clicking again to remove
 * it. A self-connected delegate — it reads the applied keys from the grouping
 * store itself rather than being handed them, so no parent drills grouping
 * state through the menu.
 *
 * `current` is **this column when it is a key**, not the first key, and that is
 * what makes `deriveToggleCommandState` say the right thing under multi-key
 * grouping: "active" means the table is grouped by this column, whatever else
 * it is also grouped by. Reading `keys[0]` would light up only the outermost
 * level and leave every deeper one looking unapplied.
 *
 * At the depth cap the item is disabled unless removing this key is what a
 * click would do. Refusing past the cap is `resolveTableGroupingUpdate`'s job
 * and happens whatever this button says; disabling here is so a user is not
 * offered an action that would be ignored.
 */
export const GroupByColumnButton = <TData,>({
  columnKey,
  onClose,
}: GroupByColumnButtonProps<TData>) => {
  const toggleGroupKey = useToggleTableGroupKey();
  const groupingKeys = useGetTableGroupingKeys();
  const column = useGetNormalizedColumn<TData>(columnKey);
  const { isGroupable } = resolveColumnCapabilities(column);
  const { icon: GroupByColumnCommandIcon, label } = GROUP_BY_COLUMN_COMMAND;

  const isApplied = groupingKeys.includes(String(columnKey));
  const isAtDepthCap = groupingKeys.length >= MAX_TABLE_GROUP_KEYS;
  const { isActive, isEnabled } = deriveToggleCommandState({
    current: isApplied ? String(columnKey) : undefined,
    isDisabled: !isGroupable || (isAtDepthCap && !isApplied),
    target: String(columnKey),
  });

  const handleGroupByColumn = () => {
    toggleGroupKey(String(columnKey));
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
