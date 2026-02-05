import { useTableDrawerContextValue } from '../../../useTableDrawerContextValue.hook';

/**
 * Hook to clear all column filters
 */
export const useResetColumnFilters = () => {
  const { columnsStore } = useTableDrawerContextValue();

  const columnsState = columnsStore.get();

  return () => {
    const current = columnsState?.columnFilters ?? {};

    if (Object.keys(current).length === 0) {
      // No filters to clear
      return;
    }

    columnsStore.set({ columnFilters: {} });
  };
};
