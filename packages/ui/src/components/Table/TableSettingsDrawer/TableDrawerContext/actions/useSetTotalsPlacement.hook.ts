import type { TableTotalsPlacement } from '#ui/components/Table/Table.types';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useSetTotalsPlacement = () => {
  const { totalsPlacementStore } = useTableDrawerContextValue();

  return (totalsPlacement: TableTotalsPlacement) => {
    totalsPlacementStore.set({ totalsPlacement });
  };
};
