import type { TableAggregateFn } from '#ui/components/Table/Table.types';

export type ShareOfTotalToggleProps = {
  readonly columnKey: string;
  /**
   * Identity, not state — a column may carry several, and `sum` and `count` are both
   * shareable (#831).
   */
  readonly fn: TableAggregateFn;
  readonly isBusy?: boolean;
  readonly label: string;
};
