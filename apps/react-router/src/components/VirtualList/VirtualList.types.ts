import type { SelectFilter } from "@/types/filterOperators.types";

export type ListFilterMode = "all" | "selected" | "unselected";

export type VirtualListDataState = {
  readonly data: readonly string[];
  readonly hasMore: boolean;
  readonly isLoading: boolean;
  readonly isLoadingMore: boolean;
  /** Total number of items available (used for "Loaded: x / total" display) */
  readonly totalCount?: number;
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
  /** Name attribute for the search input */
  /** When true, the list expands to fill all available vertical space */
  readonly shouldFillHeight?: boolean;
};
