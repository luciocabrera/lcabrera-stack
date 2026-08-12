import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { useColumnDrawerContextValue } from '#ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';

/**
 * Hook to update the column filter
 */
export const useSetColumnFilter = () => {
  const { columnStore } = useColumnDrawerContextValue();

  return (columnFilter?: ColumnFilter) => {
    columnStore.set({ columnFilter });
  };
};
