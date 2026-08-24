import type {
  TableAggregateFn,
  TableGroupAggregateValue,
} from '#ui/components/Table/Table.types';

export type TableGroupShareProps = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
  readonly value: TableGroupAggregateValue['value'];
};
