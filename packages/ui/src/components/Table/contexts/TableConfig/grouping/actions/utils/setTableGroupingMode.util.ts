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
  ...grouping,
  mode,
});
