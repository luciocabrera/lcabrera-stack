import { useSyncExternalStore } from 'react';

import type { ColumnOrderSectionModalsState } from './ColumnOrderSectionContext.types';

import { INITIAL_MODALS_STATE } from './ColumnOrderSectionContext.constants';
import { useColumnOrderSectionContextValue } from './useColumnOrderSectionContextValue.hook';

export const useModalsStore = <TSelected>(
  selector: (state: ColumnOrderSectionModalsState) => TSelected,
) => {
  const { modalsStore } = useColumnOrderSectionContextValue();

  const getSnapshot = () => modalsStore.get() ?? INITIAL_MODALS_STATE;
  const getServerSnapshot = () =>
    modalsStore.getServerSnapshot() ?? INITIAL_MODALS_STATE;

  const state = useSyncExternalStore(
    modalsStore.subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );

  return state;
};
