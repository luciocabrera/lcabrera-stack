// import type {
//   ColumnFiltersState,
//   ColumnOrderState,
//   ColumnVisibilityState,
//   SortingState,
//   // TableColumn,
// } from '@/components/Table';

/**
 * TableSettingsDrawer component props
 */
export type TableSettingsDrawerProps = {
  /** Available table columns */
  // columns: TableColumn[];
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Whether the drawer is pinned (stays open) */
  isPinned?: boolean;
  /** Callback when drawer should close */
  onClose: () => void;
  /** Callback when pin state changes */
  onPinChange?: (isPinned: boolean) => void;
  /** Callback to imperatively update URL state (called on Accept/Apply) */
  // onUpdateURLState?: (args: UpdateURLStateArgs) => void;
};

// type UpdateURLStateArgs = {
//   columnFilters: ColumnFiltersState;
//   columnOrder: ColumnOrderState;
//   columnVisibility: ColumnVisibilityState;
//   sorting: SortingState;
// };
