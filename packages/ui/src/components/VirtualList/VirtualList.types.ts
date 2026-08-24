import type { SelectFilter } from '#ui/types/filterOperators.types';

export type ListFilterMode = 'all' | 'selected' | 'unselected';

export type VirtualListConfigState = {
  readonly hasCheckboxes: boolean;
  readonly hasFetchInitial: boolean;
  readonly hasFetchMore: boolean;
  readonly hasSelectAll: boolean;
  readonly listMaxHeight: string;
  readonly name?: string;
  readonly shouldFillHeight: boolean;
};

export type VirtualListContentMode = 'empty' | 'list' | 'loading';

export type VirtualListDataState = {
  readonly data: readonly string[];
  readonly hasMore: boolean;
  readonly isLoading: boolean;
  readonly isLoadingMore: boolean;
  readonly totalCount?: number;
};

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
  readonly dataState: VirtualListDataState;
  readonly filter?: SelectFilter;
  readonly hasCheckboxes?: boolean;
  readonly hasSelectAll?: boolean;
  readonly listMaxHeight?: string;
  readonly name?: string;
  readonly onChange: (filter?: SelectFilter) => void;
  readonly onFetchInitial?: () => Promise<void> | void;
  readonly onFetchMore?: () => Promise<void> | void;
  readonly shouldFillHeight?: boolean;
};

export type VirtualListState = VirtualListConfigState & VirtualListUiState;

export type VirtualListUiState = {
  readonly listFilterMode: ListFilterMode;
  readonly searchTerm: string;
};
