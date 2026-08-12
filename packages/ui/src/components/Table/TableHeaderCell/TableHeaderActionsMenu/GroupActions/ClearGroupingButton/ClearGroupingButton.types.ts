import type { DataKey } from '#ui/components/Table/Table.types';

/** Props for the "Clear Grouping" item of the grouping section. */
export type ClearGroupingButtonProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
};
