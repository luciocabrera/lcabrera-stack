import type { TableAggregateFn } from '#ui/components/Table/Table.types';

export type ShareOfTotalToggleProps = {
  readonly columnKey: string;
  /**
   * Which of the column's aggregates this share belongs to. Identity, not
   * state — a column may carry several, and `sum` and `count` are both
   * shareable (#831).
   */
  readonly fn: TableAggregateFn;
  readonly isBusy?: boolean;
  /** The aggregate's user-facing name, used to disambiguate the control. */
  readonly label: string;
};
