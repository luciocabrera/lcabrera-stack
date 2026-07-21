import type { ColumnFilter } from '@lcabrera/ui/types/filterOperators.types';

import { useColumnDrawerContextValue } from '@lcabrera/ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';

/**
 * Hook to update the column filter
 */
export const useSetColumnFilter = () => {
  const { columnStore } = useColumnDrawerContextValue();

  return (columnFilter?: ColumnFilter) => {
    columnStore.set({ columnFilter });
  };
};
