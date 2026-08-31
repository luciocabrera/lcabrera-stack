import type { DataKey } from '#ui/components/Table/Table.types';

export type AggregateActionsProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
};
