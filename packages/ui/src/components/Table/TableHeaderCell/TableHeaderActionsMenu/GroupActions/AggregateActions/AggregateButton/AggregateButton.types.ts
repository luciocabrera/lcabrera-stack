import type { TableAggregateFn } from '#ui/components/Table/Table.types';

export type AggregateButtonProps = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
  readonly onClose: () => void;
  /** Hover text stating the band the toggle reaches, on a measure's menu. */
  readonly title?: string;
};
