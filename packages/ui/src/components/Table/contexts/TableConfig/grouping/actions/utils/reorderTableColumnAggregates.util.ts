import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

type ReorderTableColumnAggregatesArgs = {
  readonly grouping: TableGroupingState;
  readonly orderedIds: readonly string[];
};

export const reorderTableColumnAggregates = ({
  grouping,
  orderedIds,
}: ReorderTableColumnAggregatesArgs): TableGroupingState => {
  const rankById = new Map(orderedIds.map((id, index) => [id, index]));
  const unrankedRank = orderedIds.length;

  const rankOf = (aggregate: TableGroupingState['aggregates'][number]) =>
    rankById.get(toTableAggregateToken(aggregate)) ?? unrankedRank;

  return {
    aggregates: grouping.aggregates.toSorted(
      (left, right) => rankOf(left) - rankOf(right),
    ),
    keys: grouping.keys,
    mode: grouping.mode,
    periods: grouping.periods,
    shares: grouping.shares,
  };
};
