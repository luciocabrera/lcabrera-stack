import type { DataKey, TableColumn } from '@/components/Table/Table.types';
import type { ColumnFilter, OperatorType } from '@/types/filterOperators.types';

export type InputContentProps<TData> = {
  /** Column key (for stable input names) */
  columnKey: DataKey<TData>;
  /** Column configuration */
  dataType: TableColumn<TData>['dataType'];
  /** Current filter value */
  filter?: ColumnFilter;
  /** Static or fetched filter options for select/multiselect */
  filterOptions?: string[];
  /** Whether there are more options to load */
  /** Max height for the virtual options list (CSS value, e.g. '12rem') */
  listMaxHeight?: string;
  /** Callback when filter changes */
  onChange: (filter?: ColumnFilter) => void;
  /** Callback to load more options (for infinite scroll) */

  operator: OperatorType;
};
