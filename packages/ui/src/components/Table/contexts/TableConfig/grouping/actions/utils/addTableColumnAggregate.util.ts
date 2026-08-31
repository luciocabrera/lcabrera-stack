import type {
  TableAggregateFn,
  TableGroupingState,
} from '#ui/components/Table/Table.types';

type AddTableColumnAggregateArgs = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
  readonly grouping: TableGroupingState;
};

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
