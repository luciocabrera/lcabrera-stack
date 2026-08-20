import type {
  TableAggregateFn,
  TableGroupingState,
} from '#ui/components/Table/Table.types';

import { pruneGroupShares } from '../../utils';

type SetTableColumnAggregateArgs = {
  readonly columnKey: string;
  /** The function to apply, or `undefined` to clear this column's aggregate. */
  readonly fn: TableAggregateFn | undefined;
  readonly grouping: TableGroupingState;
};

/**
 * Sets or clears the aggregate applied to one column.
 *
 * At most one per column, because that is the whole shape the compact URL param
 * can carry (ADR-061) — and a state the transport cannot express is a state a
 * shared link silently loses.
 *
 * The map is rebuilt by filtering entries rather than by `delete`, so nothing
 * mutates the state it was handed and a cleared column leaves no `undefined`
 * behind for `Object.keys` to still report.
 */
export const setTableColumnAggregate = ({
  columnKey,
  fn,
  grouping,
}: SetTableColumnAggregateArgs): TableGroupingState => {
  const remaining = Object.entries(grouping.aggregates).filter(
    ([column]) => column !== columnKey,
  );

  const aggregates = Object.fromEntries(
    fn === undefined ? remaining : [...remaining, [columnKey, fn]],
  );

  return {
    aggregates,
    keys: grouping.keys,
    mode: grouping.mode,
    periods: grouping.periods,
    // Pruned against the **new** aggregate map, not cleared: changing one
    // column's measure says nothing about any other column's share, and a share
    // whose own measure just became non-additive has to go with it (#648).
    shares: pruneGroupShares({ aggregates, shares: grouping.shares }),
  };
};
