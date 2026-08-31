import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import {
  deriveToggleCommandState,
  GROUP_BY_COLUMN_COMMAND,
} from '#ui/components/Table/commands';
import { useGetNormalizedColumn } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useToggleTableGroupKey } from '#ui/components/Table/contexts/TableConfig/grouping/actions';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import {
  useGetTableColumnGroupingCapability,
  useGetTableIsGroupingLocked,
} from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import {
  MAX_TABLE_GROUP_KEYS,
  TABLE_GROUP_KEY_APPLIED_LABEL,
  TABLE_GROUP_KEY_REFUSAL_LABELS,
} from '#ui/components/Table/Table.constants';
import { tableActionsPopoverStyles } from '#ui/components/Table/TableActionsPopover';
import { resolveGroupKeyAvailability } from '#ui/components/Table/utils/resolveGroupKeyAvailability.util';

import type { GroupByColumnButtonProps } from './GroupByColumnButton.types';

export const GroupByColumnButton = <TData,>({
  columnKey,
  onClose,
}: GroupByColumnButtonProps<TData>) => {
  const toggleGroupKey = useToggleTableGroupKey();
  const groupingKeys = useGetTableGroupingKeys();
  const column = useGetNormalizedColumn<TData>(columnKey);
  const capability = useGetTableColumnGroupingCapability(String(columnKey));
  const isGroupingLocked = useGetTableIsGroupingLocked();
  const { isGroupable, refusal, requiredPeriod } =
    resolveGroupKeyAvailability<TData>({ capability, column });
  const { icon: GroupByColumnCommandIcon, label } = GROUP_BY_COLUMN_COMMAND;

  if (isGroupingLocked) return;

  const isApplied = groupingKeys.includes(String(columnKey));
  const isAtDepthCap = groupingKeys.length >= MAX_TABLE_GROUP_KEYS;
  const { isActive, isEnabled } = deriveToggleCommandState({
    current: isApplied ? String(columnKey) : undefined,
    isDisabled: isApplied || !isGroupable || isAtDepthCap,
    target: String(columnKey),
  });

  const resolveTitle = () => {
    if (isApplied) return TABLE_GROUP_KEY_APPLIED_LABEL;
    if (refusal === undefined || isEnabled) return;

    return `Cannot group by this column: ${TABLE_GROUP_KEY_REFUSAL_LABELS[refusal]}.`;
  };

  const title = resolveTitle();

  const handleGroupByColumn = () => {
    toggleGroupKey({ columnKey: String(columnKey), period: requiredPeriod });
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
      {...(title !== undefined && { title })}
      variant={isActive ? 'primary' : 'ghost'}
    >
      {label}
    </Button>
  );
};
