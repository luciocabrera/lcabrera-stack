import { useColumnDrawerContextValue } from '@lcabrera/ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';

export const useSetColumnPinning = () => {
  const { columnStore } = useColumnDrawerContextValue();

  return (columnPinning?: 'left' | 'right') => {
    columnStore.set({ columnPinning });
  };
};
