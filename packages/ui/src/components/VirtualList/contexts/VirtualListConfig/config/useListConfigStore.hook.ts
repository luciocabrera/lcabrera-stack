import { useSyncExternalStore } from 'react';

import type { VirtualListConfigState } from '../../../VirtualList.types';

import { useVirtualListConfigContextValue } from '../useVirtualListConfigContextValue.hook';
import { INITIAL_LIST_CONFIG_STATE } from '../VirtualListConfigContext.constants';

export const useListConfigStore = <TSelected>(
  selector: (state: VirtualListConfigState) => TSelected,
) => {
  const { configStore } = useVirtualListConfigContextValue();

  const getSnapshot = () => configStore.get() ?? INITIAL_LIST_CONFIG_STATE;
  const getServerSnapshot = () =>
    configStore.getServerSnapshot() ?? INITIAL_LIST_CONFIG_STATE;

  const state = useSyncExternalStore(
    configStore.subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );

  return state;
};
