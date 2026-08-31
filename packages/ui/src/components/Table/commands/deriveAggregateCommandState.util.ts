import type {
  TableAggregateFn,
  TableColumnAggregate,
} from '#ui/components/Table/Table.types';

type AggregateCommandStateArgs = {
  readonly applied: readonly TableColumnAggregate[];
  readonly columnKey: string;
  readonly isDisabled: boolean;
  readonly target: TableAggregateFn | undefined;
};

export const deriveAggregateCommandState = ({
  applied,
  columnKey,
  isDisabled,
  target,
}: AggregateCommandStateArgs) => {
  const onColumn = applied.filter((entry) => entry.columnKey === columnKey);

  return {
    isActive:
      target !== undefined && onColumn.some((entry) => entry.fn === target),
    isEnabled: !isDisabled && (target !== undefined || onColumn.length > 0),
  };
};
