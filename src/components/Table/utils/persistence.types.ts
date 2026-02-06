import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
} from '../Table.types';

export type PersistedState = {
  columnFilters?: ColumnFiltersState;
  columnOrder?: ColumnOrderState;
  columnPinning?: ColumnPinningState;
  columnSizing?: ColumnSizingState;
  columnVisibility?: ColumnVisibilityState;
  sorting?: SortingState;
  version: number;
};
