import type { DataKey } from '@/components/Table/Table.types';
import type { SelectFilter } from '@/types/filterOperators.types';

export type SelectFilterInputProps<TData> = {
  columnKey: DataKey<TData>;
  filter?: SelectFilter;
  /** Height for the virtual options list (CSS value, e.g. '12rem') */
  listMaxHeight?: string;
  onChange: (filter?: SelectFilter) => void;
};
