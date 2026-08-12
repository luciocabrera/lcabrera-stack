import type { DataKey } from '#ui/components/Table/Table.types';

/** Props for the grouping section of the column header actions menu. */
export type GroupActionsProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
};
