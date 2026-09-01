import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { resolveTableGroupingUpdate } from './resolveTableGroupingUpdate.util';

type ApplyGroupingReducerArgs = {
  readonly deriveNextGrouping: (
    current: TableGroupingState,
  ) => TableGroupingState;
  readonly existingGrouping: TableGroupingState;
  readonly hasDefaultGrouping?: boolean;
};

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
