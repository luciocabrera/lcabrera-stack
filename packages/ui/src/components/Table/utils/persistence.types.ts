import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableTotalsPlacement,
} from '../Table.types';

export type PersistedState<TData = Record<string, unknown>> = {
  readonly columnFilters?: ColumnFiltersState<TData>;
  readonly columnOrder?: ColumnOrderState<TData>;
  readonly columnPinning?: ColumnPinningState<TData>;
  readonly columnSizing?: ColumnSizingState<TData>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  readonly sorting?: SortingState<TData>;
  readonly version: number;
};

export type PersistedUiState = {
  readonly columnSettingsSelectedTab?: string;
  readonly isColumnSettingsOpen?: boolean;
  readonly isColumnSettingsPinned?: boolean;
  readonly isTableSettingsOpen?: boolean;
  readonly isTableSettingsPinned?: boolean;
  readonly tableSettingsExpandedFilters?: readonly string[];
  readonly tableSettingsSelectedTab?: string;
  readonly totalsPlacement?: TableTotalsPlacement;
};
