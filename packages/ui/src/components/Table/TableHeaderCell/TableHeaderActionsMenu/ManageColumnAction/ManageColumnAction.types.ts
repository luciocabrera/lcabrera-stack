import type { DataKey } from '@lcabrera/ui/components/Table/Table.types';

/** Props for the "Manage Column" item of the column header actions menu. */
export type ManageColumnActionProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly onClose: () => void;
};
