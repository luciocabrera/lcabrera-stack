import type { ColumnFiltersState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../../../useTableDrawerContextValue.hook';

/**
 * Hook to reset filters to the original table configuration state
 */
export const useResetFilters = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnsStore: columnsDrawerStore } = useTableDrawerContextValue();

  return () => {
    const columnsState = columnsStore.get();

    columnsDrawerStore.set({
      columnFilters: columnsState?.columnFilters ?? ({} as ColumnFiltersState),
    });
  };
};
