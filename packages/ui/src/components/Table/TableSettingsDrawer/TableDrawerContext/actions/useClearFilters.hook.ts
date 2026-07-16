import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

/**
 * Hook to clear all column filters (set to empty).
 */
export const useClearFilters = () => {
  const { columnsStore } = useTableDrawerContextValue();

  return () => {
    columnsStore.set({ columnFilters: {} });
  };
};
