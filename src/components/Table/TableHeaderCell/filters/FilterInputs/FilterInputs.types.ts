import type { DataKey } from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';

export type FilterInputsProps<TData> = {
  /** Column key to identify which filter data to use from context */
  columnKey: DataKey<TData>;
  /** Current filter value */
  filter?: ColumnFilter;
  /** Max height for the virtual options list (CSS value, e.g. '12rem') */
  listMaxHeight?: string;
  /** Callback when filter changes */
  onChange: (filter?: ColumnFilter) => void;
};
