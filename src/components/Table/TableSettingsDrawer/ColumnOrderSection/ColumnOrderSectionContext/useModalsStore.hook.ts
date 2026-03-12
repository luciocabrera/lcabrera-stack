import { useSyncExternalStore } from 'react';

import type { ColumnOrderSectionModalsState } from './ColumnOrderSectionContext.types';

import { useColumnOrderSectionContextValue } from './useColumnOrderSectionContextValue.hook';

export const useModalsStore = <TSelected>(
  selector: (state: ColumnOrderSectionModalsState) => TSelected,
) => {
  const { modalsStore } = useColumnOrderSectionContextValue();

  const state = useSyncExternalStore(
    modalsStore.subscribe,
    () => selector(modalsStore.get()!),
    () => selector(modalsStore.getServerSnapshot()!),
  );

  return state;
};
