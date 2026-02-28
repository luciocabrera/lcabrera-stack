import type { DataKey } from '@/components/Table/Table.types';

export type FilterDrawerProps<TData> = {
  columnKey: DataKey<TData>;
  isOpen: boolean;
  onClose: () => void;
};
