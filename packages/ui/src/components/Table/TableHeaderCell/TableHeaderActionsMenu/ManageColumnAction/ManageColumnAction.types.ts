import type { DataKey } from '#ui/components/Table/Table.types';

export type ManageColumnActionProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
};
