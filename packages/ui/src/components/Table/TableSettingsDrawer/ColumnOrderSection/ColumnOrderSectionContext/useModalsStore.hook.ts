import { useStoreSelector } from '#ui/hooks/useStoreSelector.hook';

import type { ColumnOrderSectionModalsState } from './ColumnOrderSectionContext.types';

import { useColumnOrderSectionContextValue } from './useColumnOrderSectionContextValue.hook';

export const useModalsStore = <TSelected>(
  selector: (state: ColumnOrderSectionModalsState) => TSelected,
) => {
  const { modalsStore } = useColumnOrderSectionContextValue();

  return useStoreSelector({
    selector,
    store: modalsStore,
  });
};
