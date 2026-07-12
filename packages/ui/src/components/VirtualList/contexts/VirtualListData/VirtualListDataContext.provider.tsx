import { useStore } from '@repo/ui/hooks';
import { useEffect } from 'react';

import type { VirtualListDataStoreState } from '../../VirtualList.types';
import type {
  VirtualListDataContextValue,
  VirtualListDataProviderProps,
} from './VirtualListDataContext.types';

import { useVirtualListConfigContextValue } from '../VirtualListConfig/useVirtualListConfigContextValue.hook';
import { INITIAL_LIST_UI_STATE } from '../VirtualListConfig/VirtualListConfigContext.constants';
import { getInitialListDataState } from './utils';
import { VirtualListDataContext } from './VirtualListDataContext.context';

/**
 * Provides the VirtualList data context. The data store mirrors the
 * controlled `dataState`/`filter` props (plus pre-computed derived state)
 * via a sync effect; selection writes always exit through `onChange`.
 * Must render inside `VirtualListConfigProvider`.
 */
export const VirtualListDataProvider = ({
  children,
  dataState,
  filter,
  hasSelectAll,
  onFetchInitial,
}: VirtualListDataProviderProps) => {
  const { uiStore } = useVirtualListConfigContextValue();

  const dataStore = useStore<VirtualListDataStoreState>(
    getInitialListDataState({
      dataState,
      filter,
      hasFetchInitial: Boolean(onFetchInitial),
      hasSelectAll,
      listFilterMode: INITIAL_LIST_UI_STATE.listFilterMode,
      searchTerm: INITIAL_LIST_UI_STATE.searchTerm,
    }),
  );

  useEffect(() => {
    const uiState = uiStore.get() ?? INITIAL_LIST_UI_STATE;

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
  }, [dataState, dataStore, filter, hasSelectAll, onFetchInitial, uiStore]);

  useEffect(() => {
    if (onFetchInitial) {
      void onFetchInitial();
    }
  }, [onFetchInitial]);

  const value: VirtualListDataContextValue = { dataStore };

  return (
    <VirtualListDataContext value={value}>{children}</VirtualListDataContext>
  );
};
