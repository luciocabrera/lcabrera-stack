import type { SelectFilter } from '@/types/filterOperators.types';

export type ListFilterMode = 'all' | 'selected' | 'unselected';

export type VirtualListDataState = {
  data: string[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  /** Total number of items available (used for "Loaded: x / total" display) */
  totalCount?: number;
};

export type VirtualListProps = {
  /** Current state of the data (from async fetch or static) */
  dataState: VirtualListDataState;
  /** Current filter state (selected values) */
  filter?: SelectFilter;
  /** Whether to show checkboxes next to options (default: true) */
  hasCheckboxes?: boolean;
  /** Whether to show "Select All" option when multiple options exist (default: true) */
  hasSelectAll?: boolean;
  /** Height for the virtual options list (CSS value, e.g. '12rem') */
  listMaxHeight?: string;
  name?: string;
  /** Called when the selection changes */
  onChange: (filter?: SelectFilter) => void;
  /** Callback to fetch initial data on mount */
  onFetchInitial?: () => Promise<void> | void;
  /** Callback to fetch more data on scroll (infinite loading) */
  onFetchMore?: () => Promise<void> | void;
  /** Name attribute for the search input */
  /** When true, the list expands to fill all available vertical space */
  shouldFillHeight?: boolean;
};
