import type { DataKey } from '#ui/components/Table/Table.types';

/** Props for the "Group by This" item of the grouping section. */
export type GroupByColumnButtonProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
};
