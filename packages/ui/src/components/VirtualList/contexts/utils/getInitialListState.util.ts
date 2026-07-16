import type {
  VirtualListState,
  VirtualListUiState,
} from '../../VirtualList.types';
import type { VirtualListStateProps } from '../VirtualListContext.types';

import { LIST_MAX_HEIGHT } from '../../VirtualList.constants';
import { INITIAL_LIST_STATE } from '../VirtualListContext.constants';

type GetInitialListStateArgs = Partial<VirtualListUiState> &
  VirtualListStateProps;

/**
 * Builds the complete list-store state from the grouped `listState` props:
 * the config mirror (with `hasFetchInitial`/`hasFetchMore` derived from the
 * callbacks) plus the list-owned UI fields. UI fields default to the initial
 * values — the provider sync effect re-passes the current ones so a config
 * re-sync never clobbers in-flight UI state.
 */
export const getInitialListState = ({
  hasCheckboxes = true,
  hasSelectAll = true,
  listFilterMode = INITIAL_LIST_STATE.listFilterMode,
  listMaxHeight = LIST_MAX_HEIGHT,
  name,
  onFetchInitial,
  onFetchMore,
  searchTerm = INITIAL_LIST_STATE.searchTerm,
  shouldFillHeight = false,
}: GetInitialListStateArgs) => {
  const state: VirtualListState = {
    hasCheckboxes,
    hasFetchInitial: Boolean(onFetchInitial),
    hasFetchMore: Boolean(onFetchMore),
    hasSelectAll,
    listFilterMode,
    listMaxHeight,
    name,
    searchTerm,
    shouldFillHeight,
  };

  return state;
};
