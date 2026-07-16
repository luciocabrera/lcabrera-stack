import { useSyncExternalStore } from 'react';

import type { VirtualListState } from '../../VirtualList.types';

import { useVirtualListContextValue } from '../useVirtualListContextValue.hook';
import { INITIAL_LIST_STATE } from '../VirtualListContext.constants';

export const useListStore = <TSelected>(
  selector: (state: VirtualListState) => TSelected,
) => {
  const { listStore } = useVirtualListContextValue();

  const getSnapshot = () => listStore.get() ?? INITIAL_LIST_STATE;
  const getServerSnapshot = () =>
    listStore.getServerSnapshot() ?? INITIAL_LIST_STATE;

  const state = useSyncExternalStore(
    listStore.subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );

  return state;
};
