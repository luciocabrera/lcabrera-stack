import type {
  TableGroupingState,
  TableGroupPeriod,
} from '#ui/components/Table/Table.types';

type SetTableGroupKeyPeriodArgs = {
  readonly columnKey: string;
  readonly grouping: TableGroupingState;
  readonly period: TableGroupPeriod | undefined;
};

/**
 * Sets — or clears — the granularity one temporal group key is truncated to (#786).
 * The map is rebuilt by filtering entries rather than by `delete`, the way
 * `setTableColumnAggregate` beside it is, so nothing mutates the state it was handed and a
 * cleared column leaves no `undefined` behind for `Object.keys` to still report — which
 * matters here beyond tidiness: the server refuses a granularity map naming a column that
 * is not a group key, and an `undefined` entry still has a key.
 */
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
