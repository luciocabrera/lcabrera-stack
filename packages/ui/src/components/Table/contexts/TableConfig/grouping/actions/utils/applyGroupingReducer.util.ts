import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { resolveTableGroupingUpdate } from './resolveTableGroupingUpdate.util';

type ApplyGroupingReducerArgs = {
  readonly deriveNextGrouping: (
    current: TableGroupingState,
  ) => TableGroupingState;
  /** The snapshot the caller already read — never a second `store.get()`. */
  readonly existingGrouping: TableGroupingState;
};

/**
 * One interaction's grouping change, expressed the way the action hooks take
 * it: a reducer from the current configuration to the next one.
 *
 * Taking the snapshot as an argument is the point — the store is read once per
 * interaction, at the call site, and two reads of one store in a single action
 * path can straddle a concurrent update.
 *
 * Shared by the live write path (`useSetTableGrouping`) and the drawer's draft
 * one (`useSetGrouping`), which differ only in what they do with an `updated`
 * result: the live one persists and navigates, the draft one only stages.
 * Sharing the resolution is what stops the drawer staging a configuration the
 * commit would then refuse.
 */
export const applyGroupingReducer = ({
  deriveNextGrouping,
  existingGrouping,
}: ApplyGroupingReducerArgs) =>
  resolveTableGroupingUpdate({
    existingGrouping,
    nextGrouping: deriveNextGrouping(existingGrouping),
  });
