import { useColumnDrawerContextValue } from '@repo/ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';

export const useSetColumnPinning = () => {
  const { columnStore } = useColumnDrawerContextValue();

  return (columnPinning?: 'left' | 'right') => {
    columnStore.set({ columnPinning });
  };
};
