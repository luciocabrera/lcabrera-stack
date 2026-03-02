import type { Sorting } from '@/types/ui.types';

import { useColumnDrawerContextValue } from '../../../useColumnDrawerContextValue.hook';

/**
 * Hook to update sorting state
 */
export const useSetColumnsSortings = () => {
  const { columnStore } = useColumnDrawerContextValue();

  return (sorting: Sorting<unknown>) => {
    columnStore.set({ sorting });
  };
};
