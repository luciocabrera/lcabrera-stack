import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { resolveTableGroupingUpdate } from './resolveTableGroupingUpdate.util';

type ApplyGroupingReducerArgs = {
  readonly deriveNextGrouping: (
    current: TableGroupingState,
  ) => TableGroupingState;
  /** The snapshot the caller already read — never a second `store.get()`. */
  readonly existingGrouping: TableGroupingState;
  /**
   * Forwarded to `resolveTableGroupingUpdate`, which uses it only to decide how
   * an empty configuration is written to the URL. The drawer's draft path omits
   * it because it never persists (#578).
   */
  readonly hasDefaultGrouping?: boolean;
};

/**
 * One interaction's grouping change, expressed the way the action hooks take it: a reducer
 * from the current configuration to the next one.
 * Shared by the live write path (`useSetTableGrouping`) and the drawer's draft one
 * (`useSetGrouping`), which differ only in what they do with an `updated` result: the live
 * one persists and navigates, the draft one only stages.
 */
export const applyGroupingReducer = ({
  deriveNextGrouping,
  existingGrouping,
  hasDefaultGrouping,
}: ApplyGroupingReducerArgs) =>
  resolveTableGroupingUpdate({
    existingGrouping,
    hasDefaultGrouping,
    nextGrouping: deriveNextGrouping(existingGrouping),
  });
