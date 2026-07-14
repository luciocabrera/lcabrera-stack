import { useSyncExternalStore } from 'react';

import type { VirtualListDataStoreState } from '../../VirtualList.types';

import { useVirtualListContextValue } from '../useVirtualListContextValue.hook';
import { INITIAL_LIST_DATA_STATE } from '../VirtualListContext.constants';

export const useListDataStore = <TSelected>(
  selector: (state: VirtualListDataStoreState) => TSelected,
) => {
  const { dataStore } = useVirtualListContextValue();

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
