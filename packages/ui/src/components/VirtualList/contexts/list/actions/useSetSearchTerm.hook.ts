import { resolveListDerivedState } from '../../../utils';
import { useVirtualListContextValue } from '../../useVirtualListContextValue.hook';
import {
  INITIAL_LIST_DATA_STATE,
  INITIAL_LIST_STATE,
} from '../../VirtualListContext.constants';

/**
 * Updates the header search term and recomputes the derived list state in
 * the data store (filtered options, select-all flags, content mode).
 */
export const useSetSearchTerm = () => {
  const { dataStore, listStore } = useVirtualListContextValue();

  return (searchTerm: string) => {
    const listState = listStore.get() ?? INITIAL_LIST_STATE;
    const dataState = dataStore.get() ?? INITIAL_LIST_DATA_STATE;

    listStore.set({ searchTerm });
    dataStore.set(
      resolveListDerivedState({
        data: dataState.data,
        hasFetchInitial: listState.hasFetchInitial,
        hasSelectAll: listState.hasSelectAll,
        isLoading: dataState.isLoading,
        isLoadingMore: dataState.isLoadingMore,
        listFilterMode: listState.listFilterMode,
        searchTerm,
        selectedValues: dataState.selectedValues,
      }),
    );
  };
};
