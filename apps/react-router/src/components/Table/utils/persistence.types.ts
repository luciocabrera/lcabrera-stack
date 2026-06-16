import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableDataState,
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

/**
 * Meta UI state persisted per-tab in sessionStorage only.
 * These fields are not written to cookies and are never sent to the server.
 */
export type PersistedUiState = {
  readonly isColumnSettingsOpen?: boolean;
  readonly columnSettingsSelectedTab?: string;
  readonly isColumnSettingsPinned?: boolean;
  readonly isTableSettingsPinned?: boolean;
  readonly isTableSettingsOpen?: boolean;
  readonly tableSettingsExpandedFilters?: readonly string[];
  readonly tableSettingsSelectedTab?: string;
};

/**
 * Table data state persisted per-tab in sessionStorage only.
 * Used to paint stale rows immediately during refresh.
 */
export type PersistedDataState<TData = Record<string, unknown>> = Pick<
  TableDataState<TData>,
  'data' | 'totalRows'
>;
