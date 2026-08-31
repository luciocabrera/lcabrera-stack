import type { TableAggregateFn } from '#ui/components/Table/Table.types';

export type ShareOfTotalToggleProps = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
  readonly isBusy?: boolean;
  readonly label: string;
};
