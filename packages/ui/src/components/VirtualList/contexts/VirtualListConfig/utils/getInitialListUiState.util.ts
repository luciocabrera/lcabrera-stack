import type { VirtualListUiState } from '../../../VirtualList.types';

import { INITIAL_LIST_UI_STATE } from '../VirtualListConfigContext.constants';

type GetInitialListUiStateArgs = Partial<VirtualListUiState>;

/** Builds the initial UI-store state, allowing per-field overrides. */
export const getInitialListUiState = ({
  listFilterMode = INITIAL_LIST_UI_STATE.listFilterMode,
  searchTerm = INITIAL_LIST_UI_STATE.searchTerm,
}: GetInitialListUiStateArgs = {}) => ({
  listFilterMode,
  searchTerm,
});
