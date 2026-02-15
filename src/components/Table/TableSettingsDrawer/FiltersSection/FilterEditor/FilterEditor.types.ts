import type { DataKey, TableColumn } from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';


export type FilterEditorProps<TData> = {
  /** Column key to identify which filter data to use from context */
  columnKey: DataKey<TData>;
  /** The column being filtered */
  column: TableColumn<TData>;
  /** Current filter value */
  filter: ColumnFilter | null | undefined;
  /** Whether the filter value is valid */
  isValid?: boolean;
  /** Callback when filter changes */
  onChange: (filter: ColumnFilter | null | undefined) => void;
};
