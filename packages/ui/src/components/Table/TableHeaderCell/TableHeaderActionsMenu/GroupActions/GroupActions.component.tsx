import type { GroupActionsProps } from './GroupActions.types';

import { ClearGroupingButton } from './ClearGroupingButton/ClearGroupingButton.component';
import { GroupByColumnButton } from './GroupByColumnButton/GroupByColumnButton.component';

/**
 * Grouping section of the column header actions menu — a thin shell composing
 * the group-by and clear-grouping delegates. Each delegate owns its own
 * `useSetTableGrouping` wiring and reads the applied key from the grouping
 * store itself; this shell forwards only `columnKey` and `onClose`.
 */
export const GroupActions = <TData,>({
  columnKey,
  onClose,
}: GroupActionsProps<TData>) => (
  <>
    <GroupByColumnButton columnKey={columnKey} onClose={onClose} />
    <ClearGroupingButton columnKey={columnKey} onClose={onClose} />
  </>
);
