import type { SortDirection } from '@repo/ui/types/ui.types';

import { useColumnDrawerContextValue } from '@repo/ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';

/**
 * Hook to update the sort direction for this column
 */
export const useSetColumnSorting = () => {
  const { columnStore } = useColumnDrawerContextValue();

  return (sorting: SortDirection) => {
    columnStore.set({ sorting });
  };
};
