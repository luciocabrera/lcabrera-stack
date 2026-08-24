import type {
  TableAggregateFn,
  TableGroupingState,
} from '#ui/components/Table/Table.types';

import { pruneGroupShares } from '../../utils';

type RemoveTableColumnAggregateArgs = {
  readonly columnKey: string;
  readonly fn?: TableAggregateFn;
  readonly grouping: TableGroupingState;
};

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
