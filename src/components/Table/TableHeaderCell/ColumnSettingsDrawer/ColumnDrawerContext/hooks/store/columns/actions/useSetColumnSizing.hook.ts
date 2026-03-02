import { useColumnDrawerContextValue } from '../../../useColumnDrawerContextValue.hook';

/**
 * Hook to set the column width
 */
export const useSetColumnSizing = () => {
  const { columnStore } = useColumnDrawerContextValue();

  return (columnSizing: number | undefined) => {
    columnStore.set({ columnSizing });
  };
};
