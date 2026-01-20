import type { ColumnFilter, TableColumn } from '@/components/Table/Table.types';

export type FilterEditorProps = {
  /** The column being filtered */
  column: TableColumn;
  /** Current filter value */
  filter: ColumnFilter | null | undefined;
  /** Static filter options for select filters */
  filterOptions?: string[];
  /** Whether the filter is currently loading options */
  isLoadingOptions?: boolean;
  /** Whether the filter value is valid */
  isValid?: boolean;
  /** Callback when filter changes */
  onChange: (filter: ColumnFilter | null | undefined) => void;
  /** Callback when more options need to be loaded */
  onLoadMoreOptions?: () => void;
};

export type FilterValidationResult = {
  isValid: boolean;
  message?: string;
};
