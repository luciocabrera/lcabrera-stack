import type { ColumnFilter } from '@/types/filterOperators.types';

import { useColumnDrawerContextValue } from '@/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';

/**
 * Hook to update the column filter
 */
export const useSetColumnFilter = () => {
  const { columnStore } = useColumnDrawerContextValue();

  return (columnFilter?: ColumnFilter) => {
    columnStore.set({ columnFilter });
  };
};
