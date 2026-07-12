import { useSyncExternalStore } from 'react';

import type { VirtualListDataStoreState } from '../../../VirtualList.types';

import { useVirtualListDataContextValue } from '../useVirtualListDataContextValue.hook';
import { INITIAL_LIST_DATA_STATE } from '../VirtualListDataContext.constants';

export const useListDataStore = <TSelected>(
  selector: (state: VirtualListDataStoreState) => TSelected,
) => {
  const { dataStore } = useVirtualListDataContextValue();

  const getSnapshot = () => dataStore.get() ?? INITIAL_LIST_DATA_STATE;
  const getServerSnapshot = () =>
    dataStore.getServerSnapshot() ?? INITIAL_LIST_DATA_STATE;

  const state = useSyncExternalStore(
    dataStore.subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );

  return state;
};
