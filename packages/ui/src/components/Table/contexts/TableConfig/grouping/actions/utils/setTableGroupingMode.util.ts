import type {
  TableGroupingMode,
  TableGroupingState,
} from '#ui/components/Table/Table.types';

type SetTableGroupingModeArgs = {
  readonly grouping: TableGroupingState;
  readonly mode: TableGroupingMode;
};

export const setTableGroupingMode = ({
  grouping,
  mode,
}: SetTableGroupingModeArgs): TableGroupingState => ({
  aggregates: grouping.aggregates,
  keys: grouping.keys,
  mode,
  periods: grouping.periods,
  shares: grouping.shares,
});
