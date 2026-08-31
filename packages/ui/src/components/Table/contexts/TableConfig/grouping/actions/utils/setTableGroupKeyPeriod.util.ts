import type {
  TableGroupingState,
  TableGroupPeriod,
} from '#ui/components/Table/Table.types';

type SetTableGroupKeyPeriodArgs = {
  readonly columnKey: string;
  readonly grouping: TableGroupingState;
  readonly period: TableGroupPeriod | undefined;
};

export const setTableGroupKeyPeriod = ({
  columnKey,
  grouping,
  period,
}: SetTableGroupKeyPeriodArgs): TableGroupingState => {
  const remaining = Object.entries(grouping.periods).filter(
    ([column]) => column !== columnKey,
  );

  return {
    aggregates: grouping.aggregates,
    keys: grouping.keys,
    mode: grouping.mode,
    periods: Object.fromEntries(
      period === undefined ? remaining : [...remaining, [columnKey, period]],
    ),
    shares: grouping.shares,
  };
};
