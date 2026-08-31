import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  deriveToggleCommandState,
  REMOVE_GROUP_KEY_COMMAND,
} from '#ui/components/Table/commands';
import { useToggleTableGroupKey } from '#ui/components/Table/contexts/TableConfig/grouping/actions';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { useGetTableIsGroupingLocked } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';

import type { RemoveGroupKeyButtonProps } from './RemoveGroupKeyButton.types';

export const RemoveGroupKeyButton = <TData,>({
  columnKey,
  onClose,
}: RemoveGroupKeyButtonProps<TData>) => {
  const toggleGroupKey = useToggleTableGroupKey();
  const groupingKeys = useGetTableGroupingKeys();
  const isGroupingLocked = useGetTableIsGroupingLocked();
  const { icon: RemoveGroupKeyCommandIcon, label } = REMOVE_GROUP_KEY_COMMAND;

  if (isGroupingLocked) return;

  const isApplied = groupingKeys.includes(String(columnKey));
  const { isEnabled } = deriveToggleCommandState({
    current: isApplied ? String(columnKey) : undefined,
    isDisabled: !isApplied,
    target: undefined,
  });

  const handleRemoveGroupKey = () => {
    toggleGroupKey({ columnKey: String(columnKey) });
    onClose();
  };

  return (
    <Button
      customStylex={tableActionsPopoverStyles.menuItem}
      icon={
        <span {...stylex.props(tableActionsPopoverStyles.menuIcon)}>
          <RemoveGroupKeyCommandIcon size={16} />
        </span>
      }
      isDisabled={!isEnabled}
      onClick={handleRemoveGroupKey}
      orientation='horizontal'
      size='mini'
      variant='ghost'
    >
      {label}
    </Button>
  );
};
