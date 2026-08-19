import type { GroupActionsProps } from './GroupActions.types';

import { AggregateActions } from './AggregateActions';
import { ClearGroupingButton } from './ClearGroupingButton/ClearGroupingButton.component';
import { CollapseAllGroupsButton } from './CollapseAllGroupsButton/CollapseAllGroupsButton.component';
import { ExpandAllGroupsButton } from './ExpandAllGroupsButton/ExpandAllGroupsButton.component';
import { GroupByColumnButton } from './GroupByColumnButton/GroupByColumnButton.component';

/**
 * Grouping section of the column header actions menu — a thin shell composing
 * the group-by, clear-grouping and aggregation-mode delegates. Each delegate
 * owns its own action wiring and reads what it needs from the grouping store
 * itself.
 *
 * Only the group-by and aggregate delegates are handed the column: the first
 * groups *by* that column, the second aggregates *it*, so that column's own
 * capability is the right gate for each. Clearing grouping and folding every
 * group are whole-table actions and are handed no column at all, which is what
 * stops them being gated on one.
 *
 * The fold pair sits here rather than in the settings drawer's grouping
 * section because that section stages its edits behind Accept (#654) and
 * expansion is client state that takes effect immediately (ADR-061, #774).
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
