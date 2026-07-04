import type { ColumnFiltersState } from '@repo/ui/components/Table/Table.types';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

/**
 * Hook to update column filters
 */
export const useSetColumnFilters = () => {
  const { columnsStore } = useTableDrawerContextValue();

  return (columnFilters: ColumnFiltersState) => {
    columnsStore.set({ columnFilters });
  };
};
