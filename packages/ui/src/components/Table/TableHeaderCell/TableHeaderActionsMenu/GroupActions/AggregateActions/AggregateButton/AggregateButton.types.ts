import type { TableAggregateFn } from '#ui/components/Table/Table.types';

/** Props for one aggregation-mode item of the grouping section. */
export type AggregateButtonProps = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
  readonly onClose: () => void;
};
