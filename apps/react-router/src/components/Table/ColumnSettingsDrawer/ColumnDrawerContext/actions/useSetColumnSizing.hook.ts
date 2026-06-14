import { useColumnDrawerContextValue } from '@/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';

/**
 * Hook to set the column width
 */
export const useSetColumnSizing = () => {
  const { columnStore } = useColumnDrawerContextValue();

  return (columnSizing?: number) => {
    columnStore.set({ columnSizing });
  };
};
