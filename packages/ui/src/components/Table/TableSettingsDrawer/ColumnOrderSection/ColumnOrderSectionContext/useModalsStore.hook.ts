import { useStoreSelector } from '@repo/ui/hooks/useStoreSelector.hook';

import type { ColumnOrderSectionModalsState } from './ColumnOrderSectionContext.types';

import { INITIAL_MODALS_STATE } from './ColumnOrderSectionContext.constants';
import { useColumnOrderSectionContextValue } from './useColumnOrderSectionContextValue.hook';

export const useModalsStore = <TSelected>(
  selector: (state: ColumnOrderSectionModalsState) => TSelected,
) => {
  const { modalsStore } = useColumnOrderSectionContextValue();

  return useStoreSelector({
    fallback: INITIAL_MODALS_STATE,
    selector,
    store: modalsStore,
  });
};
