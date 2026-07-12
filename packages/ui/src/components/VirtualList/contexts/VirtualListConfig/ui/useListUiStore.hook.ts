import { useSyncExternalStore } from 'react';

import type { VirtualListUiState } from '../../../VirtualList.types';

import { useVirtualListConfigContextValue } from '../useVirtualListConfigContextValue.hook';
import { INITIAL_LIST_UI_STATE } from '../VirtualListConfigContext.constants';

export const useListUiStore = <TSelected>(
  selector: (state: VirtualListUiState) => TSelected,
) => {
  const { uiStore } = useVirtualListConfigContextValue();

  const getSnapshot = () => uiStore.get() ?? INITIAL_LIST_UI_STATE;
  const getServerSnapshot = () =>
    uiStore.getServerSnapshot() ?? INITIAL_LIST_UI_STATE;

  const state = useSyncExternalStore(
    uiStore.subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );

  return state;
};
