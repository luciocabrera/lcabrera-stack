import type {
  VirtualListConfigState,
  VirtualListUiState,
} from '../../VirtualList.types';

export const INITIAL_LIST_CONFIG_STATE: VirtualListConfigState = {
  hasCheckboxes: true,
  hasFetchInitial: false,
  hasFetchMore: false,
  hasSelectAll: true,
};

export const INITIAL_LIST_UI_STATE: VirtualListUiState = {
  listFilterMode: 'all',
  searchTerm: '',
};
