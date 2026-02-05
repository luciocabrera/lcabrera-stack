import type { TableColumn } from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';

export type FilterInputsProps<TData> = {
  /** Column configuration */
  column: TableColumn<TData>;
  /** Current filter value */
  filter?: ColumnFilter;
  /** Static or fetched filter options for select/multiselect */
  filterOptions?: string[];
  /** Whether there are more options to load */
  hasMore?: boolean;
  /** Whether currently loading more options */
  isLoadingOptions?: boolean;
  /** Callback when filter changes */
  onChange: (filter?: ColumnFilter) => void;
  /** Callback to load more options (for infinite scroll) */
  onLoadMoreOptions?: () => void;
};
