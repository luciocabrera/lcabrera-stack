import type { DataKey } from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';

export type FilterSectionBodyProps<TData> = {
  columnKey: DataKey<TData>;
  filter?: ColumnFilter;
  onChange: (filter?: ColumnFilter) => void;
};
