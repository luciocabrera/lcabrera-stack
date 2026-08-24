import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useClearSorting = () => {
  const { columnsStore } = useTableDrawerContextValue();

  return () => {
    columnsStore.set({ sorting: [] });
  };
};
