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

/**
 * Meta UI state persisted to a cookie, so the SSR loader can read it back and
 * seed the initial meta state. The cookie is the only channel the server can
 * see, which is why it carries the whole drawer state — open/pinned reserves
 * the drawer's width on first paint, and the selected tab and expanded filters
 * decide what is painted inside it. Anything kept client-side instead could
 * only contradict the server's markup and shift at hydration.
 */
export type PersistedUiState = {
  readonly columnSettingsSelectedTab?: string;
  readonly isColumnSettingsOpen?: boolean;
  readonly isColumnSettingsPinned?: boolean;
  readonly isTableSettingsOpen?: boolean;
  readonly isTableSettingsPinned?: boolean;
  readonly tableSettingsExpandedFilters?: readonly string[];
  readonly tableSettingsSelectedTab?: string;
  /**
   * The user's totals placement (#578). It rides this cookie because it must
   * outlive the session, and the `totals` search param because it must reach
   * the loader that emits the `ORDER BY` — the param wins where both are
   * present, so this is what a fresh URL falls back to.
   */
  readonly totalsPlacement?: TableTotalsPlacement;
};
