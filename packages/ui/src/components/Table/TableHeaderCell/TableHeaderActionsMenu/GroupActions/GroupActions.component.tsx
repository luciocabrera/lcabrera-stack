import { useGetTableIsGroupingLocked } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { TableActionsPopoverSeparator } from '#ui/components/Table/TableActionsPopover';

import type { GroupActionsProps } from './GroupActions.types';

import { AggregateActions } from './AggregateActions';
import { ClearGroupingButton } from './ClearGroupingButton/ClearGroupingButton.component';
import { CollapseAllGroupsButton } from './CollapseAllGroupsButton/CollapseAllGroupsButton.component';
import { ExpandAllGroupsButton } from './ExpandAllGroupsButton/ExpandAllGroupsButton.component';
import { GroupByColumnButton } from './GroupByColumnButton/GroupByColumnButton.component';
import { GroupLevelActions } from './GroupLevelActions/GroupLevelActions.component';
import { RemoveGroupKeyButton } from './RemoveGroupKeyButton/RemoveGroupKeyButton.component';

export const GroupActions = <TData,>({
  columnKey,
  onClose,
}: GroupActionsProps<TData>) => {
  const isGroupingLocked = useGetTableIsGroupingLocked();

  return (
    <>
      <GroupByColumnButton columnKey={columnKey} onClose={onClose} />
      <RemoveGroupKeyButton columnKey={columnKey} onClose={onClose} />
      <ClearGroupingButton onClose={onClose} />
      {!isGroupingLocked && <TableActionsPopoverSeparator />}
      <ExpandAllGroupsButton onClose={onClose} />
      <CollapseAllGroupsButton onClose={onClose} />
      <GroupLevelActions columnKey={String(columnKey)} onClose={onClose} />
      <AggregateActions<TData> columnKey={columnKey} onClose={onClose} />
    </>
  );
};
