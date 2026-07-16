import type { ListFilterMode } from '../../../VirtualList.types';

import { resolveListDerivedState } from '../../../utils';
import { useVirtualListContextValue } from '../../useVirtualListContextValue.hook';
import {
  INITIAL_LIST_DATA_STATE,
  INITIAL_LIST_STATE,
} from '../../VirtualListContext.constants';

/**
 * Switches the footer filter mode and recomputes the derived list state in
 * the data store (filtered options, select-all flags, content mode).
 */
export const useSetListFilterMode = () => {
  const { dataStore, listStore } = useVirtualListContextValue();

  return (listFilterMode: ListFilterMode) => {
    const listState = listStore.get() ?? INITIAL_LIST_STATE;
    const dataState = dataStore.get() ?? INITIAL_LIST_DATA_STATE;

    listStore.set({ listFilterMode });
    dataStore.set(
      resolveListDerivedState({
        data: dataState.data,
        hasFetchInitial: listState.hasFetchInitial,
        hasSelectAll: listState.hasSelectAll,
        isLoading: dataState.isLoading,
        isLoadingMore: dataState.isLoadingMore,
        listFilterMode,
        searchTerm: listState.searchTerm,
        selectedValues: dataState.selectedValues,
      }),
    );
  };
};
