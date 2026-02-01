import type {
  ColumnFiltersState,
} from '@/components/Table/Table.types';

export type FiltersSectionProps = {
  /** Current filter state */
  filters: ColumnFiltersState;
  /** Callback when filters change */
  onFiltersChange: (filters: ColumnFiltersState) => void;
};
