import type { GroupActionsProps } from './GroupActions.types';

import { AggregateActions } from './AggregateActions';
import { ClearGroupingButton } from './ClearGroupingButton/ClearGroupingButton.component';
import { CollapseAllGroupsButton } from './CollapseAllGroupsButton/CollapseAllGroupsButton.component';
import { ExpandAllGroupsButton } from './ExpandAllGroupsButton/ExpandAllGroupsButton.component';
import { GroupByColumnButton } from './GroupByColumnButton/GroupByColumnButton.component';

/**
 * Grouping section of the column header actions menu — a thin shell composing the
 * group-by, clear-grouping and aggregation-mode delegates.
 * Each delegate owns its own action wiring and reads what it needs from the grouping store
 * itself.
 */
export const GroupActions = <TData,>({
  columnKey,
  onClose,
}: GroupActionsProps<TData>) => (
  <>
    <GroupByColumnButton columnKey={columnKey} onClose={onClose} />
    <ClearGroupingButton onClose={onClose} />
    <ExpandAllGroupsButton onClose={onClose} />
    <CollapseAllGroupsButton onClose={onClose} />
    <AggregateActions<TData> columnKey={columnKey} onClose={onClose} />
  </>
);
