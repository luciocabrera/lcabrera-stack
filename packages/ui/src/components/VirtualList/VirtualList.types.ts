import type { SelectFilter } from '@repo/ui/types/filterOperators.types';

export type ListFilterMode = 'all' | 'selected' | 'unselected';

/** Static configuration mirrored into the config store */
export type VirtualListConfigState = {
  readonly hasCheckboxes: boolean;
  readonly hasFetchInitial: boolean;
  readonly hasFetchMore: boolean;
  readonly hasSelectAll: boolean;
  /** CSS max-height of the scrollable list (read where rendered: VirtualListBody) */
  readonly listMaxHeight: string;
  readonly name?: string;
  /** Expand the list to fill available vertical space */
  readonly shouldFillHeight: boolean;
};

/** Body content mode: loading skeleton, empty message, or the options list */
export type VirtualListContentMode = 'empty' | 'list' | 'loading';

export type VirtualListDataState = {
  readonly data: readonly string[];
  readonly hasMore: boolean;
  readonly isLoading: boolean;
  readonly isLoadingMore: boolean;
  /** Total number of items available (used for "Loaded: x / total" display) */
  readonly totalCount?: number;
};

/**
 * Data-store state: mirror of the parent-owned `dataState`/`filter` props
 * plus the pre-computed derived list state (recomputed by the data provider
 * sync effect and the UI actions; selectors read it as one-liners).
 */
export type VirtualListDataStoreState = {
  readonly contentMode: VirtualListContentMode;
  readonly data: readonly string[];
  readonly filteredOptions: readonly string[];
  readonly hasMore: boolean;
  readonly isAllSelected: boolean;
  readonly isLoading: boolean;
  readonly isLoadingMore: boolean;
  readonly selectedValues: readonly string[];
  readonly shouldShowSelectAll: boolean;
  readonly totalCount?: number;
  readonly totalItems: number;
};

export type VirtualListProps = {
  /** Current state of the data (from async fetch or static) */
  readonly dataState: VirtualListDataState;
  /** Current filter state (selected values) */
  readonly filter?: SelectFilter;
  /** Whether to show checkboxes next to options (default: true) */
  readonly hasCheckboxes?: boolean;
  /** Whether to show "Select All" option when multiple options exist (default: true) */
  readonly hasSelectAll?: boolean;
  /** Height for the virtual options list (CSS value, e.g. '12rem') */
  readonly listMaxHeight?: string;
  readonly name?: string;
  /** Called when the selection changes */
  readonly onChange: (filter?: SelectFilter) => void;
  /** Callback to fetch initial data on mount */
  readonly onFetchInitial?: () => Promise<void> | void;
  /** Callback to fetch more data on scroll (infinite loading) */
  readonly onFetchMore?: () => Promise<void> | void;
  /** When true, the list expands to fill all available vertical space */
  readonly shouldFillHeight?: boolean;
};

/**
 * Complete list-store state: the config props mirror plus the list-owned UI
 * state. Config fields are written only by the provider sync effect; UI
 * fields only by the list UI actions.
 */
export type VirtualListState = VirtualListConfigState & VirtualListUiState;

/** UI state owned by the VirtualList itself (uncontrolled) */
export type VirtualListUiState = {
  readonly listFilterMode: ListFilterMode;
  readonly searchTerm: string;
};
