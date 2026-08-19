import { useStoreSelector } from '#ui/hooks/useStoreSelector.hook';

import type { TableDrawerTotalsPlacementState } from './TableDrawerContext.types';

import { useTableDrawerContextValue } from './useTableDrawerContextValue.hook';

export const useTotalsPlacementStore = <TSelected>(
  selector: (state: TableDrawerTotalsPlacementState) => TSelected,
) => {
  const { totalsPlacementStore } = useTableDrawerContextValue();

  return useStoreSelector({ selector, store: totalsPlacementStore });
};
