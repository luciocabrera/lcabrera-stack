import type { ListFilterMode } from '../../../../VirtualList.types';

import { resolveListDerivedState } from '../../../../utils';
import { useVirtualListDataContextValue } from '../../../VirtualListData/useVirtualListDataContextValue.hook';
import { INITIAL_LIST_DATA_STATE } from '../../../VirtualListData/VirtualListDataContext.constants';
import { useVirtualListConfigContextValue } from '../../useVirtualListConfigContextValue.hook';
import {
  INITIAL_LIST_CONFIG_STATE,
  INITIAL_LIST_UI_STATE,
} from '../../VirtualListConfigContext.constants';

/**
 * Switches the footer filter mode and recomputes the derived list state in
 * the data store (filtered options, select-all flags, content mode).
 */
export const useSetListFilterMode = () => {
  const { configStore, uiStore } = useVirtualListConfigContextValue();
  const { dataStore } = useVirtualListDataContextValue();

  return (listFilterMode: ListFilterMode) => {
    const configState = configStore.get() ?? INITIAL_LIST_CONFIG_STATE;
    const dataState = dataStore.get() ?? INITIAL_LIST_DATA_STATE;
    const uiState = uiStore.get() ?? INITIAL_LIST_UI_STATE;

    uiStore.set({ listFilterMode });
    dataStore.set(
      resolveListDerivedState({
        data: dataState.data,
        hasFetchInitial: configState.hasFetchInitial,
        hasSelectAll: configState.hasSelectAll,
        isLoading: dataState.isLoading,
        isLoadingMore: dataState.isLoadingMore,
        listFilterMode,
        searchTerm: uiState.searchTerm,
        selectedValues: dataState.selectedValues,
      }),
    );
  };
};
