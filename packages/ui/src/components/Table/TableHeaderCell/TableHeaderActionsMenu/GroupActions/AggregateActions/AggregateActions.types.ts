import type { DataKey } from '#ui/components/Table/Table.types';

/** Props for the aggregation-mode block of the grouping section. */
export type AggregateActionsProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
};
