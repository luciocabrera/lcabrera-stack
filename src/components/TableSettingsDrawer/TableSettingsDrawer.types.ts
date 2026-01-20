import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
} from '@/components/Table';

/**
 * TableSettingsDrawer component props
 */
export type TableSettingsDrawerProps = {
  /** Current column filters state */
  columnFilters: ColumnFiltersState;
  /** Current column order state */
  columnOrder: ColumnOrderState;
  /** Available table columns */
  columns: TableColumn[];
  /** Current column sizing state */
  columnSizing: ColumnSizingState;
  /** Current column visibility state */
  columnVisibility: ColumnVisibilityState;
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Whether the drawer is pinned (stays open) */
  isPinned?: boolean;
  /** Callback when drawer should close */
  onClose: () => void;
  /** Callback when column filters change */
  onColumnFiltersChange: (columnFilters: ColumnFiltersState) => void;
  /** Callback when column order changes */
  onColumnOrderChange: (columnOrder: ColumnOrderState) => void;
  /** Callback when column sizing changes */
  onColumnSizingChange: (columnSizing: ColumnSizingState) => void;
  /** Callback when column visibility changes */
  onColumnVisibilityChange: (columnVisibility: ColumnVisibilityState) => void;
  /** Callback when pin state changes */
  onPinChange?: (isPinned: boolean) => void;
  /** Callback when sorting changes */
  onSortingChange: (sorting: SortingState) => void;
  /** Current sorting state */
  sorting: SortingState;
};
