import type { DataKey } from '#ui/components/Table/Table.types';

export type RemoveGroupKeyButtonProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
};
