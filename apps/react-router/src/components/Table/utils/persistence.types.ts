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

/**
 * Meta UI state persisted per-tab in sessionStorage only.
 * These fields are not written to cookies and are never sent to the server.
 */
export type PersistedUiState = {
  readonly isColumnSettingsOpen?: boolean;
  readonly isTableSettingsPinned?: boolean;
  readonly isTableSettingsOpen?: boolean;
  readonly tableSettingsExpandedFilters?: readonly string[];
  readonly tableSettingsSelectedTab?: string;
};
