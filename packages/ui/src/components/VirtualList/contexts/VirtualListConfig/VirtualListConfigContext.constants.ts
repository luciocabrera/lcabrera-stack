import type {
  VirtualListConfigState,
  VirtualListUiState,
} from '../../VirtualList.types';

import { LIST_MAX_HEIGHT } from '../../VirtualList.constants';

export const INITIAL_LIST_CONFIG_STATE: VirtualListConfigState = {
  hasCheckboxes: true,
  hasFetchInitial: false,
  hasFetchMore: false,
  hasSelectAll: true,
  listMaxHeight: LIST_MAX_HEIGHT,
  shouldFillHeight: false,
};

export const INITIAL_LIST_UI_STATE: VirtualListUiState = {
  listFilterMode: 'all',
  searchTerm: '',
};
