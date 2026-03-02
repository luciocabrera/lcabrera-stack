import type { ColumnFiltersState } from '@/components/Table/Table.types';

import { useColumnDrawerContextValue } from '../../../useColumnDrawerContextValue.hook';

/**
 * Hook to update column filters
 */
export const useSetColumnFilters = () => {
  const { columnStore } = useColumnDrawerContextValue();

  return (columnFilters: ColumnFiltersState) => {
    columnStore.set({ columnFilters });
  };
};
