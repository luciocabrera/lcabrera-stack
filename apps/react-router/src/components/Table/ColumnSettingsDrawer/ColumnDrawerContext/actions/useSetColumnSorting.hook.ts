import type { SortDirection } from '@/types/ui.types';

import { useColumnDrawerContextValue } from '@/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';

/**
 * Hook to update the sort direction for this column
 */
export const useSetColumnSorting = () => {
  const { columnStore } = useColumnDrawerContextValue();

  return (sorting: SortDirection) => {
    columnStore.set({ sorting });
  };
};
