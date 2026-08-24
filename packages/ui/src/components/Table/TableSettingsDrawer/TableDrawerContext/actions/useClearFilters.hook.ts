import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useClearFilters = () => {
  const { columnsStore } = useTableDrawerContextValue();

  return () => {
    columnsStore.set({ columnFilters: {} });
  };
};
