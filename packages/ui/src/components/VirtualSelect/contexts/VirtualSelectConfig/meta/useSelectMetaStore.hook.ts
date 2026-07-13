import { useSyncExternalStore } from 'react';

import type { VirtualSelectMetaState } from '../../../VirtualSelect.types';

import { useVirtualSelectConfigContextValue } from '../useVirtualSelectConfigContextValue.hook';
import { INITIAL_SELECT_META_STATE } from '../VirtualSelectConfigContext.constants';

export const useSelectMetaStore = <TSelected>(
  selector: (state: VirtualSelectMetaState) => TSelected,
) => {
  const { metaStore } = useVirtualSelectConfigContextValue();

  const getSnapshot = () => metaStore.get() ?? INITIAL_SELECT_META_STATE;
  const getServerSnapshot = () =>
    metaStore.getServerSnapshot() ?? INITIAL_SELECT_META_STATE;

  const state = useSyncExternalStore(
    metaStore.subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );

  return state;
};
