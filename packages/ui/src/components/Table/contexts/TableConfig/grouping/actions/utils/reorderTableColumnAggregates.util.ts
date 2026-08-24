import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

type ReorderTableColumnAggregatesArgs = {
  readonly grouping: TableGroupingState;
  readonly orderedIds: readonly string[];
};

/**
 * A **permutation**, never a replacement: it takes ids and sorts the entries it was
 * handed, so it can neither invent an aggregate nor drop one.
 * That matters because the aggregate list a surface renders is not always the whole staged
 * list — `toAggregateItems` hides an aggregate whose column the route no longer declares,
 * which a consumer's own loader can still seed — and rebuilding the list from the visible
 * rows would silently un-stage it.
 */
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
