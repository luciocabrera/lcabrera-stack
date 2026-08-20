import type {
  TableAggregateFn,
  TableGroupAggregateValue,
} from '#ui/components/Table/Table.types';

export type TableGroupShareProps = {
  readonly columnKey: string;
  /** Which of the column's aggregates this share is of (#831). */
  readonly fn: TableAggregateFn;
  /** The aggregate's raw value, exactly as the read produced it. */
  readonly value: TableGroupAggregateValue['value'];
};
