import type { ComponentPropsWithoutRef } from 'react';

import type {
  SortDirection,
  SortingState,
  TableColumn,
} from '@/components/Table/Table.types';

/**
 * SortingSection component props
 */
export type SortingSectionProps = ComponentPropsWithoutRef<'div'> & {
  /** Available columns that can be sorted */
  columns: TableColumn[];
  /** Callback when sort state changes */
  onSortChange: (sorting: SortingState) => void;
  /** Current sorting state */
  sorting: SortingState;
};

/**
 * Individual sort item for display
 */
export type SortItem = {
  columnKey: string;
  direction: SortDirection;
  label: string;
};
