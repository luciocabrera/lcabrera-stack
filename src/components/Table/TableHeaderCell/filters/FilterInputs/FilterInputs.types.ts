import type { DataKey, TableColumn } from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';

export type FilterInputsProps<TData> = {
  /** Column key to identify which filter data to use from context */
  columnKey: DataKey<TData>;
  /** Current filter value */
  filter?: ColumnFilter;
  /** Callback when filter changes */
  onChange: (filter?: ColumnFilter) => void;
};
