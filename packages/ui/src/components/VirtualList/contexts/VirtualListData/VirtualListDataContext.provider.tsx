import { useStore } from '@repo/ui/hooks';
import { useEffect } from 'react';

import type { VirtualListDataStoreState } from '../../VirtualList.types';
import type {
  VirtualListDataContextValue,
  VirtualListDataProviderProps,
} from './VirtualListDataContext.types';

import {
  useGetHasFetchInitial,
  useGetHasSelectAll,
} from '../VirtualListConfig/config/selectors';
import { useVirtualListConfigContextValue } from '../VirtualListConfig/useVirtualListConfigContextValue.hook';
import { INITIAL_LIST_UI_STATE } from '../VirtualListConfig/VirtualListConfigContext.constants';
import { getInitialListDataState } from './utils';
import { VirtualListDataContext } from './VirtualListDataContext.context';

/**
 * Provides the VirtualList data context. The data store mirrors the
 * controlled `dataState`/`filter` props (plus pre-computed derived state)
 * via a sync effect; selection writes always exit through `onChange`.
 * Config flags (`hasSelectAll`, `hasFetchInitial`) and the initial-fetch
 * callback are read from the config context — never duplicated as props —
 * so it must render inside `VirtualListConfigProvider`.
 */
export const VirtualListDataProvider = ({
  children,
  dataState,
  filter,
}: VirtualListDataProviderProps) => {
  const { onFetchInitial, uiStore } = useVirtualListConfigContextValue();
  const hasFetchInitial = useGetHasFetchInitial();
  const hasSelectAll = useGetHasSelectAll();

  const dataStore = useStore<VirtualListDataStoreState>(
    getInitialListDataState({
      dataState,
      filter,
      hasFetchInitial,
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
        hasFetchInitial,
        hasSelectAll,
        listFilterMode: uiState.listFilterMode,
        searchTerm: uiState.searchTerm,
      }),
    );
  }, [dataState, dataStore, filter, hasFetchInitial, hasSelectAll, uiStore]);

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
