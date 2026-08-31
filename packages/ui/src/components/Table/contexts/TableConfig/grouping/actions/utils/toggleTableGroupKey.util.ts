import type {
  TableGroupingMode,
  TableGroupingState,
  TableGroupPeriod,
} from '#ui/components/Table/Table.types';

import {
  pruneGroupPeriods,
  resolveNewGroupingMode,
} from '#ui/components/Table/contexts/TableConfig/grouping/utils';

type ToggleTableGroupKeyArgs = {
  readonly columnKey: string;
  readonly grouping: TableGroupingState;
  readonly period?: TableGroupPeriod;
  readonly preferredMode?: TableGroupingMode;
};

export const toggleTableGroupKey = ({
  columnKey,
  grouping,
  period,
  preferredMode,
}: ToggleTableGroupKeyArgs): TableGroupingState => {
  const isRemoval = grouping.keys.includes(columnKey);
  const keys = isRemoval
    ? grouping.keys.filter((key) => key !== columnKey)
    : [...grouping.keys, columnKey];
  const pruned = pruneGroupPeriods({ keys, periods: grouping.periods });

  return {
    aggregates: grouping.aggregates,
    keys,
    mode: resolveNewGroupingMode({
      keys,
      preferredMode,
      previousKeys: grouping.keys,
      previousMode: grouping.mode,
    }),
    periods:
      isRemoval || period === undefined
        ? pruned
        : { ...pruned, [columnKey]: period },
    shares: grouping.shares,
  };
};
