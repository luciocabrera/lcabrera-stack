import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
} from '../Table.types';

export type PersistedState = {
  readonly columnFilters?: ColumnFiltersState;
  readonly columnOrder?: ColumnOrderState;
  readonly columnPinning?: ColumnPinningState;
  readonly columnSizing?: ColumnSizingState;
  readonly columnVisibility?: ColumnVisibilityState;
  readonly sorting?: SortingState;
  readonly version: number;
};
