import type { DataKey, TableColumn } from '@/components/Table/Table.types';
import type { ColumnFilter, OperatorType } from '@/types/filterOperators.types';

export type InputContentProps<TData> = {
  /** Column configuration */
  dataType: TableColumn<TData>['dataType'];
  /** Column key (for stable input names) */
  columnKey: DataKey<TData>;
  /** Current filter value */
  filter?: ColumnFilter;
  /** Static or fetched filter options for select/multiselect */
  filterOptions?: string[];
  /** Whether there are more options to load */

  /** Callback when filter changes */
  onChange: (filter?: ColumnFilter) => void;
  /** Callback to load more options (for infinite scroll) */

  operator: OperatorType;
};
