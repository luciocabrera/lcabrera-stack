import type {
  TableGroupingState,
  TableGroupPeriod,
} from '#ui/components/Table/Table.types';

import { pruneGroupPeriods } from '#ui/components/Table/contexts/TableConfig/grouping/utils';

type ToggleTableGroupKeyArgs = {
  readonly columnKey: string;
  readonly grouping: TableGroupingState;
  /** The granularity to add the key **with**, when the column is only groupable truncated. */
  readonly period?: TableGroupPeriod;
};

/**
 * Appends rather than replaces — that single expression is the difference between one-key
 * and multi-key grouping, and appending at the **tail** is what makes the interaction
 * predictable: the key you add is the innermost level, the ones already there keep their
 * nesting order.
 * `resolveTableGroupingUpdate` owns that, so there is exactly one place a request past the
 * cap is refused rather than two that could disagree.
 */
export const toggleTableGroupKey = ({
  columnKey,
  grouping,
  period,
}: ToggleTableGroupKeyArgs): TableGroupingState => {
  const isRemoval = grouping.keys.includes(columnKey);
  const keys = isRemoval
    ? grouping.keys.filter((key) => key !== columnKey)
    : [...grouping.keys, columnKey];
  const pruned = pruneGroupPeriods({ keys, periods: grouping.periods });

  return {
    aggregates: grouping.aggregates,
    keys,
    mode: grouping.mode,
    periods:
      isRemoval || period === undefined
        ? pruned
        : { ...pruned, [columnKey]: period },
    shares: grouping.shares,
  };
};
