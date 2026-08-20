import type {
  TableAggregateFn,
  TableGroupingState,
} from '#ui/components/Table/Table.types';

import { pruneGroupShares } from '../../utils';

type RemoveTableColumnAggregateArgs = {
  readonly columnKey: string;
  /**
   * The one function to remove, or `undefined` to clear **every** aggregate on
   * the column — what the header menu's "No Aggregate" item asks for.
   */
  readonly fn?: TableAggregateFn;
  readonly grouping: TableGroupingState;
};

/**
 * Removes one aggregate from a column, or all of them.
 *
 * The two are one function because they differ only in the predicate, and a
 * column now holds a list: "clear this column" is "remove every entry on it",
 * and keeping them apart would be two ways to spell the same filter.
 *
 * The list is rebuilt by filtering rather than by splicing, so nothing mutates
 * the state it was handed, and the surviving entries keep their order — which is
 * the order the user arranged and the URL carries.
 */
export const removeTableColumnAggregate = ({
  columnKey,
  fn,
  grouping,
}: RemoveTableColumnAggregateArgs): TableGroupingState => {
  const aggregates = grouping.aggregates.filter(
    (entry) =>
      entry.columnKey !== columnKey || (fn !== undefined && entry.fn !== fn),
  );

  return {
    aggregates,
    keys: grouping.keys,
    mode: grouping.mode,
    periods: grouping.periods,
    // Pruned against the **new** list, not cleared: removing one measure says
    // nothing about any other measure's share, and the share of the measure
    // that just went has to go with it (#648, per aggregate since #831).
    shares: pruneGroupShares({ aggregates, shares: grouping.shares }),
  };
};
