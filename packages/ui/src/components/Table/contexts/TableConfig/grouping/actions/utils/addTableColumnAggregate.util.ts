import type {
  TableAggregateFn,
  TableGroupingState,
} from '#ui/components/Table/Table.types';

type AddTableColumnAggregateArgs = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
  readonly grouping: TableGroupingState;
};

/**
 * **Appended with a duplicate guard**, not filtered-and-re-added: a column may carry any
 * number of functions, and the one thing that must never happen is the same `(columnKey,
 * fn)` pair twice — two identical rows in the staged list, two identical tokens in the
 * URL, and a share that cannot say which of them it belongs to (#831).
 * Adding a measure says nothing about any other measure's share, and it cannot invalidate
 * one either — pruning here could only ever remove a share this call did not affect.
 */
export const addTableColumnAggregate = ({
  columnKey,
  fn,
  grouping,
}: AddTableColumnAggregateArgs): TableGroupingState => {
  const isApplied = grouping.aggregates.some(
    (entry) => entry.columnKey === columnKey && entry.fn === fn,
  );

  if (isApplied) return grouping;

  return {
    aggregates: [...grouping.aggregates, { columnKey, fn }],
    keys: grouping.keys,
    mode: grouping.mode,
    periods: grouping.periods,
    shares: grouping.shares,
  };
};
