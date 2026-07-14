import type {
  VirtualListDataStoreState,
  VirtualListState,
} from '../VirtualList.types';

import { LIST_MAX_HEIGHT } from '../VirtualList.constants';

export const INITIAL_LIST_DATA_STATE: VirtualListDataStoreState = {
  contentMode: 'empty',
  data: [],
  filteredOptions: [],
  hasMore: false,
  isAllSelected: false,
  isLoading: false,
  isLoadingMore: false,
  selectedValues: [],
  shouldShowSelectAll: false,
  totalItems: 0,
};

export const INITIAL_LIST_STATE: VirtualListState = {
  hasCheckboxes: true,
  hasFetchInitial: false,
  hasFetchMore: false,
  hasSelectAll: true,
  listFilterMode: 'all',
  listMaxHeight: LIST_MAX_HEIGHT,
  searchTerm: '',
  shouldFillHeight: false,
};
