import type { TableGroupingState } from '#ui/components/Table/Table.types';

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
 */
export const toggleTableGroupKey = ({
  columnKey,
  grouping,
}: ToggleTableGroupKeyArgs): TableGroupingState => ({
  aggregates: grouping.aggregates,
  keys: grouping.keys.includes(columnKey)
    ? grouping.keys.filter((key) => key !== columnKey)
    : [...grouping.keys, columnKey],
  mode: grouping.mode,
});
