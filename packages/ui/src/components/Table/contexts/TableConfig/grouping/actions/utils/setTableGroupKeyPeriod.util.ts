import type {
  TableGroupingState,
  TableGroupPeriod,
} from '#ui/components/Table/Table.types';

type SetTableGroupKeyPeriodArgs = {
  readonly columnKey: string;
  readonly grouping: TableGroupingState;
  /** `undefined` groups the column at its raw values again. */
  readonly period: TableGroupPeriod | undefined;
};

/**
 * Sets — or clears — the granularity one temporal group key is truncated to
 * (#786).
 *
 * The map is rebuilt by filtering entries rather than by `delete`, the way
 * `setTableColumnAggregate` beside it is, so nothing mutates the state it was
 * handed and a cleared column leaves no `undefined` behind for `Object.keys` to
 * still report — which matters here beyond tidiness: the server refuses a
 * granularity map naming a column that is not a group key, and an `undefined`
 * entry still has a key.
 *
 * A column that is not currently a key is written anyway rather than refused.
 * The surfaces only offer this for an applied key, `pruneGroupPeriods` drops it
 * the moment the key goes, and the loader-side sanitizer refuses the request
 * outright — so refusing here would be a fourth opinion on a question already
 * answered three times, with no caller able to reach it.
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
  };
};
