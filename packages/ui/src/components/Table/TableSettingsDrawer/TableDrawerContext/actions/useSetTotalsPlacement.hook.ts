import type { TableTotalsPlacement } from '#ui/components/Table/Table.types';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

/**
 * Like every other drawer action it only stages — Accept is what persists and navigates,
 * so changing the placement cannot reload the table out from under the edits queued beside
 * it.
 */
export const useSetTotalsPlacement = () => {
  const { totalsPlacementStore } = useTableDrawerContextValue();

  return (totalsPlacement: TableTotalsPlacement) => {
    totalsPlacementStore.set({ totalsPlacement });
  };
};
