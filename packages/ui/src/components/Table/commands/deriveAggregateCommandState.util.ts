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

/**
 * Active/enabled state for an aggregate command against a column (ADR-011).
 * **This exists beside `deriveToggleCommandState` rather than widening it**, and that is
 * the point of the split (#831).
 */
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
