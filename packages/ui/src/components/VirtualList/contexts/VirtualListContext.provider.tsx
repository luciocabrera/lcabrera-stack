import { useEffect } from 'react';

import { useStore } from '#ui/hooks';

import type {
  VirtualListDataStoreState,
  VirtualListState,
} from '../VirtualList.types';
import type {
  VirtualListContextValue,
  VirtualListProviderProps,
} from './VirtualListContext.types';

import { getInitialListDataState, getInitialListState } from './utils';
import { INITIAL_LIST_STATE } from './VirtualListContext.constants';
import { VirtualListContext } from './VirtualListContext.context';

export const VirtualListProvider = ({
  children,
  dataState,
  filter,
  listState,
}: VirtualListProviderProps) => {
  const {
    hasSelectAll = true,
    onChange,
    onFetchInitial,
    onFetchMore,
  } = listState;

  const listStore = useStore<VirtualListState>(getInitialListState(listState));
  const dataStore = useStore<VirtualListDataStoreState>(
    getInitialListDataState({
      dataState,
      filter,
      hasFetchInitial: Boolean(onFetchInitial),
      hasSelectAll,
      listFilterMode: INITIAL_LIST_STATE.listFilterMode,
      searchTerm: INITIAL_LIST_STATE.searchTerm,
    }),
  );

  useEffect(() => {
    const uiState = listStore.get() ?? INITIAL_LIST_STATE;

    listStore.set(
      getInitialListState({
        ...listState,
        listFilterMode: uiState.listFilterMode,
        searchTerm: uiState.searchTerm,
      }),
    );
  }, [listState, listStore]);

  useEffect(() => {
    const uiState = listStore.get() ?? INITIAL_LIST_STATE;

    dataStore.set(
      getInitialListDataState({
        dataState,
        filter,
        hasFetchInitial: Boolean(onFetchInitial),
        hasSelectAll,
        listFilterMode: uiState.listFilterMode,
        searchTerm: uiState.searchTerm,
      }),
    );
  }, [dataState, dataStore, filter, hasSelectAll, listStore, onFetchInitial]);

  useEffect(() => {
    if (onFetchInitial) {
      void onFetchInitial();
    }
  }, [onFetchInitial]);

  const value: VirtualListContextValue = {
    dataStore,
    listStore,
    onChange,
    onFetchMore,
  };

  return <VirtualListContext value={value}>{children}</VirtualListContext>;
};
