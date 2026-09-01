import type { TableAggregateFn } from '#ui/components/Table/Table.types';

export type AggregateButtonProps = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
  readonly onClose: () => void;
};
