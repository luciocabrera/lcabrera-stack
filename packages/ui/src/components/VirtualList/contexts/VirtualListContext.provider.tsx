import { useEffect } from 'react';

import { useStore } from '#ui/hooks';
import { syncStoreFromProps } from '#ui/hooks/utils/syncStoreFromProps.util';

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
    const uiState = listStore.get();

    syncStoreFromProps({
      next: getInitialListState({
        ...listState,
        listFilterMode: uiState.listFilterMode,
        searchTerm: uiState.searchTerm,
      }),
      store: listStore,
    });
  }, [listState, listStore]);

  useEffect(() => {
    const uiState = listStore.get();

    syncStoreFromProps({
      next: getInitialListDataState({
        dataState,
        filter,
        hasFetchInitial: Boolean(onFetchInitial),
        hasSelectAll,
        listFilterMode: uiState.listFilterMode,
        searchTerm: uiState.searchTerm,
      }),
      store: dataStore,
    });
  }, [dataState, dataStore, filter, hasSelectAll, listStore, onFetchInitial]);

  useEffect(() => {
    if (!onFetchInitial) return;

    const controller = new AbortController();
    void onFetchInitial(controller.signal);
    return () => {
      controller.abort();
    };
  }, [onFetchInitial]);

  const value: VirtualListContextValue = {
    dataStore,
    listStore,
    onChange,
    onFetchMore,
  };

  return <VirtualListContext value={value}>{children}</VirtualListContext>;
};
