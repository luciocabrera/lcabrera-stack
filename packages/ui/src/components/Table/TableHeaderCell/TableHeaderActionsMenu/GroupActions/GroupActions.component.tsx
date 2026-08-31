import type { GroupActionsProps } from './GroupActions.types';

import { AggregateActions } from './AggregateActions';
import { ClearGroupingButton } from './ClearGroupingButton/ClearGroupingButton.component';
import { CollapseAllGroupsButton } from './CollapseAllGroupsButton/CollapseAllGroupsButton.component';
import { ExpandAllGroupsButton } from './ExpandAllGroupsButton/ExpandAllGroupsButton.component';
import { GroupByColumnButton } from './GroupByColumnButton/GroupByColumnButton.component';
import { GroupLevelActions } from './GroupLevelActions/GroupLevelActions.component';
import { RemoveGroupKeyButton } from './RemoveGroupKeyButton/RemoveGroupKeyButton.component';

/**
 * Grouping section of the column header actions menu — a thin shell composing the
 * group-by, clear-grouping, fold and aggregation-mode delegates.
 * Each delegate owns its own action wiring and reads what it needs from the grouping store
 * itself. The fold-one-level pair sits beside the whole-table pair because it is the same
 * act at a narrower scope, and it is the only one of the four fold items that can be
 * absent — the block itself decides that (ADR-083).
 */
export const GroupActions = <TData,>({
  columnKey,
  onClose,
}: GroupActionsProps<TData>) => (
  <>
    <GroupByColumnButton columnKey={columnKey} onClose={onClose} />
    <RemoveGroupKeyButton columnKey={columnKey} onClose={onClose} />
    <ClearGroupingButton onClose={onClose} />
    <ExpandAllGroupsButton onClose={onClose} />
    <CollapseAllGroupsButton onClose={onClose} />
    <GroupLevelActions columnKey={String(columnKey)} onClose={onClose} />
    <AggregateActions<TData> columnKey={columnKey} onClose={onClose} />
  </>
);
