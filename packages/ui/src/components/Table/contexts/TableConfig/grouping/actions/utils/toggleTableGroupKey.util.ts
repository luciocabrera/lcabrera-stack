import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { pruneGroupPeriods } from '#ui/components/Table/contexts/TableConfig/grouping/utils';

type ToggleTableGroupKeyArgs = {
  readonly columnKey: string;
  readonly grouping: TableGroupingState;
};

/**
 * Adds a column to the group keys, or removes it when it is already one.
 *
 * Appends rather than replaces — that single expression is the difference
 * between one-key and multi-key grouping, and appending at the **tail** is what
 * makes the interaction predictable: the key you add is the innermost level,
 * the ones already there keep their nesting order.
 *
 * It does not enforce the depth cap. `resolveTableGroupingUpdate` owns that, so
 * there is exactly one place a request past the cap is refused rather than two
 * that could disagree.
 *
 * The column's aggregate is left alone in both directions. Aggregating a column
 * and grouping by it are independent choices, and silently dropping the first
 * because the second changed would lose a selection the user made elsewhere.
 *
 * Its **granularity** is not, and the asymmetry is the point (#786). A
 * granularity is not an independent choice about the column — it says how that
 * column is grouped, so removing the key leaves it describing nothing. It is
 * also not inert: the server refuses a granularity whose column is not a group
 * key, so keeping it would take the whole grouped read down. Adding a key adds
 * no granularity, so a date column joins at its raw values and is refused there
 * unless the surface picks one.
 */
export const toggleTableGroupKey = ({
  columnKey,
  grouping,
}: ToggleTableGroupKeyArgs): TableGroupingState => {
  const keys = grouping.keys.includes(columnKey)
    ? grouping.keys.filter((key) => key !== columnKey)
    : [...grouping.keys, columnKey];

  return {
    aggregates: grouping.aggregates,
    keys,
    mode: grouping.mode,
    periods: pruneGroupPeriods({ keys, periods: grouping.periods }),
  };
};
