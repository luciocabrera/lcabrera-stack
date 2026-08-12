import type { SortingState } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

/**
 * Hook to reset sorting to the original table configuration state
 */
export const useResetSorting = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnsStore: columnsDrawerStore } = useTableDrawerContextValue();

  return () => {
    const columnsState = columnsStore.get();

    columnsDrawerStore.set({
      sorting: columnsState?.sorting ?? ([] as SortingState),
    });
  };
};
