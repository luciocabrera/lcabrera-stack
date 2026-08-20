import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

type ReorderTableColumnAggregatesArgs = {
  readonly grouping: TableGroupingState;
  /**
   * The aggregates in their new order, named by `toTableAggregateToken` —
   * the same spelling the drawer rows carry as their `DraggableItem.id`.
   */
  readonly orderedIds: readonly string[];
};

/**
 * Re-orders the applied aggregates to the order the caller names.
 *
 * A **permutation**, never a replacement: it takes ids and sorts the entries it
 * was handed, so it can neither invent an aggregate nor drop one. That matters
 * because the aggregate list a surface renders is not always the whole staged
 * list — `toAggregateItems` hides an aggregate whose column the route no longer
 * declares, which a consumer's own loader can still seed — and rebuilding the
 * list from the visible rows would silently un-stage it. An id naming no staged
 * aggregate is likewise ignored rather than added.
 *
 * Anything the ids do not name keeps its relative order **after** everything
 * they do, on a stable sort. Any position is arbitrary for an entry no surface
 * shows; what must not happen is that it disappears.
 *
 * Reordering touches nothing else in the configuration. The keys, the mode and
 * the granularities are unrelated, and a share belongs to the `(columnKey, fn)`
 * pair rather than to a position — so moving a measure moves its share with it,
 * with nothing to prune.
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
