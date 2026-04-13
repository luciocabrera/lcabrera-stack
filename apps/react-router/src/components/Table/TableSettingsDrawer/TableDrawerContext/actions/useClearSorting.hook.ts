import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook.ts';

/**
 * Hook to clear all sorting (set to empty).
 */
export const useClearSorting = () => {
  const { columnsStore } = useTableDrawerContextValue();

  return () => {
    columnsStore.set({ sorting: [] });
  };
};
