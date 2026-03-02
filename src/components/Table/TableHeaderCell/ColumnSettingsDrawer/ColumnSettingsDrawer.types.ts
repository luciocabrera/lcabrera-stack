import type { DataKey } from '@/components/Table/Table.types';

export type ColumnSettingsDrawerProps<TData> = {
  columnKey: DataKey<TData>;
  isOpen: boolean;
  onClose: () => void;
};
