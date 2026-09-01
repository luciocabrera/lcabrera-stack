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

  const lastOfColumn = grouping.aggregates.findLastIndex(
    (entry) => entry.columnKey === columnKey,
  );
  const insertAt =
    lastOfColumn === -1 ? grouping.aggregates.length : lastOfColumn + 1;

  return {
    aggregates: [
      ...grouping.aggregates.slice(0, insertAt),
      { columnKey, fn },
      ...grouping.aggregates.slice(insertAt),
    ],
    keys: grouping.keys,
    mode: grouping.mode,
    periods: grouping.periods,
    shares: grouping.shares,
  };
};
