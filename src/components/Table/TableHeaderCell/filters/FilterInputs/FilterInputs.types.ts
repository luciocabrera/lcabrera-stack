import type { ColumnFilter, TableColumn } from '@/components/Table/Table.types';

export type FilterInputsProps = {
  /** Column configuration */
  column: TableColumn;
  /** Current text operator for string filters */
  currentTextOperator?: 'contains' | 'endsWith' | 'equals' | 'notContains' | 'notEquals' | 'startsWith';
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
  /** Callback when text operator changes */
  onTextOperatorChange?: (operator: 'contains' | 'endsWith' | 'equals' | 'notContains' | 'notEquals' | 'startsWith') => void;
};
