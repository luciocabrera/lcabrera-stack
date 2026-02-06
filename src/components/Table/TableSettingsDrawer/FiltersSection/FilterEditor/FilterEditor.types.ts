import type { TableColumn } from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';


export type FilterEditorProps<TData> = {
  /** The column being filtered */
  column: TableColumn<TData>;
  /** Current filter value */
  filter: ColumnFilter | null | undefined;
  /** Static filter options for select filters */
  filterOptions?: string[];
  /** Whether there are more options to load */
  hasMore?: boolean;
  /** Whether the filter is currently loading options */
  isLoadingOptions?: boolean;
  /** Whether the filter value is valid */
  isValid?: boolean;
  /** Callback when filter changes */
  onChange: (filter: ColumnFilter | null | undefined) => void;
  /** Callback when more options need to be loaded */
  onLoadMoreOptions?: () => void;
};
