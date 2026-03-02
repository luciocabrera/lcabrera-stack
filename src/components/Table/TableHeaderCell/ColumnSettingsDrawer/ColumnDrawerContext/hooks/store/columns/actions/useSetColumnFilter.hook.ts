import type { ColumnFilter } from '@/types/filterOperators.types';

import { useColumnDrawerContextValue } from '../../../useColumnDrawerContextValue.hook';

/**
 * Hook to update the column filter
 */
export const useSetColumnFilter = () => {
  const { columnStore } = useColumnDrawerContextValue();

  return (columnFilter: ColumnFilter | undefined) => {
    columnStore.set({ columnFilter });
  };
};
