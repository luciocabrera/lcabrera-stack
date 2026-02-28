import type { DataKey } from '@/components/Table/Table.types';
import type { SortDirection } from '@/types/ui.types';

export type SortingSectionProps<TData> = {
  columnKey: DataKey<TData>;
  onChange: (direction: SortDirection) => void;
  sortDirection: SortDirection;
};
