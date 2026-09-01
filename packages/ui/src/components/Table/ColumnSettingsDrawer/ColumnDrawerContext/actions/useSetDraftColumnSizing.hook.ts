import { useColumnDrawerContextValue } from '#ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';

export const useSetDraftColumnSizing = () => {
  const { columnStore } = useColumnDrawerContextValue();

  return (columnSizing?: number) => {
    columnStore.set({ columnSizing });
  };
};
