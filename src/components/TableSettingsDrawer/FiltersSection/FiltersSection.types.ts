import type {
  ColumnFilter,
  ColumnFiltersState,
  TableColumn,
} from '@/components/Table/Table.types';

export type FilterItem = {
  columnKey: string;
  filter: ColumnFilter;
  label: string;
};

export type FiltersSectionProps = {
  /** Available columns */
  columns: TableColumn[];
  /** Current filter state */
  filters: ColumnFiltersState;
  /** Callback when filters change */
  onFiltersChange: (filters: ColumnFiltersState) => void;
};
