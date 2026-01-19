import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  PaginationState,
  SortingState,
} from '../Table.types';

export type PersistedState = {
  columnFilters?: ColumnFiltersState;
  columnOrder?: ColumnOrderState;
  columnPinning?: ColumnPinningState;
  columnSizing?: ColumnSizingState;
  columnVisibility?: ColumnVisibilityState;
  pagination?: PaginationState;
  sorting?: SortingState;
  version: number;
};
