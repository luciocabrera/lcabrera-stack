import type { GroupActionsProps } from './GroupActions.types';

import { ClearGroupingButton } from './ClearGroupingButton/ClearGroupingButton.component';
import { GroupByColumnButton } from './GroupByColumnButton/GroupByColumnButton.component';

/**
 * Grouping section of the column header actions menu — a thin shell composing
 * the group-by and clear-grouping delegates. Each delegate owns its own
 * `useSetTableGrouping` wiring and reads the applied key from the grouping
 * store itself.
 *
 * Only the group-by delegate is handed the column: it groups *by* that column,
 * so that column's `isGroupable` is the right gate for it. Clearing is a
 * whole-table action and is handed no column at all, which is what stops it
 * being gated on one.
 */
export const GroupActions = <TData,>({
  columnKey,
  onClose,
}: GroupActionsProps<TData>) => (
  <>
    <GroupByColumnButton columnKey={columnKey} onClose={onClose} />
    <ClearGroupingButton onClose={onClose} />
  </>
);
