import type { VirtualListDataStoreState } from '../../VirtualList.types';

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
