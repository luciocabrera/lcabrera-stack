import type { DataKey, TableColumn } from '@/components/Table/Table.types';
import type { ColumnFilter, OperatorType } from '@/types/filterOperators.types';

export type InputContentProps<TData> = {
  /** Column key (for stable input names) */
  columnKey: DataKey<TData>;
  /** Column configuration */
  dataType: TableColumn<TData>['dataType'];
  /** Current filter value */
  filter?: ColumnFilter;
  /** Whether the column has an async fetcher for filter options */
  hasFetchableOptions: boolean;
  /** Height for the virtual options list (CSS value, e.g. '12rem') */
  listMaxHeight?: string;
  /** Callback when filter changes */
  onChange: (filter?: ColumnFilter) => void;

  operator: OperatorType;
  /** When true, the list expands to fill all available vertical space */
  shouldFillHeight?: boolean;
};
