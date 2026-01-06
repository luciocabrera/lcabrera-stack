import type { ComponentPropsWithoutRef } from 'react';

import type { TableColumn } from '@/components/Table/Table.types';
import type {
  ColumnOrderState,
  ColumnVisibilityState,
  SortingState,
} from '@/components/Table/TableContext';

/**
 * TableSettingsDrawer component props
 */
export type TableSettingsDrawerProps = ComponentPropsWithoutRef<'div'> & {
  /** Current column order state */
  columnOrder: ColumnOrderState;
  /** Available table columns */
  columns: TableColumn[];
  /** Current column visibility state */
  columnVisibility: ColumnVisibilityState;
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Whether the drawer is pinned (stays open) */
  isPinned?: boolean;
  /** Callback when drawer should close */
  onClose: () => void;
  /** Callback when column order changes */
  onColumnOrderChange: (columnOrder: ColumnOrderState) => void;
  /** Callback when column visibility changes */
  onColumnVisibilityChange: (columnVisibility: ColumnVisibilityState) => void;
  /** Callback when pin state changes */
  onPinChange?: (isPinned: boolean) => void;
  /** Callback when sorting changes */
  onSortingChange: (sorting: SortingState) => void;
  /** Current sorting state */
  sorting: SortingState;
};
