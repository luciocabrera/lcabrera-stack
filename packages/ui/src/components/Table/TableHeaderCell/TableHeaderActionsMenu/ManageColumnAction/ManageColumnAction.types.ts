import type { DataKey } from '@repo/ui/components/Table/Table.types';

/** Props for the "Manage Column" item of the column header actions menu. */
export type ManageColumnActionProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
};
