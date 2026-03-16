import type { SortingState } from '@/components/Table/Table.types';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

/**
 * Hook to update sorting state
 */
export const useSetColumnsSortings = () => {
  const { columnsStore } = useTableDrawerContextValue();

  return (sorting: SortingState) => {
    columnsStore.set({
      sorting: sorting.filter((s) => s.columnKey !== 'actions'),
    });
  };
};
