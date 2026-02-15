import type { DataKey } from '@/components/Table/Table.types';
import type { SelectFilter } from '@/types/filterOperators.types';

export type SelectFilterInputProps<TData> = {
  columnKey: DataKey<TData>;
  filter?: SelectFilter;

  onChange: (filter?: SelectFilter) => void;
  onLoadMore?: () => void;
  options: string[];
};
