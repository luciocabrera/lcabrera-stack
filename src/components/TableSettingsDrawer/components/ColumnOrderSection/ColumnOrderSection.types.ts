import type { ComponentPropsWithoutRef } from 'react';

import type { TableColumn } from '@/components/Table/Table.types';
import type { ColumnOrderState, ColumnVisibilityState } from '@/components/Table/TableContext';

/**
 * ColumnOrderSection component props
 */
export type ColumnOrderSectionProps = ComponentPropsWithoutRef<'div'> & {
  /** Current column order state */
  columnOrder: ColumnOrderState;
  /** Available columns */
  columns: TableColumn[];
  /** Current column visibility state */
  columnVisibility: ColumnVisibilityState;
  /** Callback when column order changes */
  onColumnOrderChange: (columnOrder: ColumnOrderState) => void;
  /** Callback when column visibility changes */
  onColumnVisibilityChange: (columnVisibility: ColumnVisibilityState) => void;
};


export type HandleToggleVisibilityArgs = {
  columnKey: string;
  isVisible: boolean;
};