import type { ColumnFilter } from '@repo/ui/types/filterOperators.types';

import { useColumnDrawerContextValue } from '@repo/ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';

/**
 * Hook to update the column filter
 */
export const useSetColumnFilter = () => {
  const { columnStore } = useColumnDrawerContextValue();

  return (columnFilter?: ColumnFilter) => {
    columnStore.set({ columnFilter });
  };
};
