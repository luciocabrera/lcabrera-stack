import type { ComponentPropsWithoutRef } from 'react';

import type { TableColumn } from '@/components/Table/Table.types';
import type {
  SortDirection,
  SortingState,
} from '@/components/Table/TableContext';

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
