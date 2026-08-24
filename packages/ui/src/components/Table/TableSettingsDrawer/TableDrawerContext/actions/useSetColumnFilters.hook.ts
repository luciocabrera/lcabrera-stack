import type { ColumnFiltersState } from '#ui/components/Table/Table.types';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useSetColumnFilters = () => {
  const { columnsStore } = useTableDrawerContextValue();

  return (columnFilters: ColumnFiltersState) => {
    columnsStore.set({ columnFilters });
  };
};
