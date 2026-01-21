import type {
  ColumnFiltersState,
  TableColumn,
} from '@/components/Table/Table.types';


export type FiltersSectionProps = {
  /** Available columns */
  columns: TableColumn[];
  /** Current filter state */
  filters: ColumnFiltersState;
  /** Callback when filters change */
  onFiltersChange: (filters: ColumnFiltersState) => void;
};
