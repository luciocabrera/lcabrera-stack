import type { ColumnFiltersState } from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';

import { useTableDrawerContextValue } from '../../../useTableDrawerContextValue.hook';

type SetColumnFilterArgs = {
  columnKey: string;
  filter?: ColumnFilter | null;
};

/**
 * Hook to update a single column filter
 */
export const useSetColumnFilter = () => {
  const { columnsStore } = useTableDrawerContextValue();

  const columnsState = columnsStore.get();

  return ({ columnKey, filter }: SetColumnFilterArgs) => {
    let columnFilters: ColumnFiltersState;
    const current = columnsState?.columnFilters ?? {};
    if (filter === null || filter === undefined) {
      // TODO: Improve later, i don't like this pattern
      // Remove the filter by creating new object without it
      const { [columnKey]: unusedFilter, ...rest } = current;
      void unusedFilter; // Explicitly mark as intentionally unused
      columnFilters = rest;
    } else {
      columnFilters = { ...current, [columnKey]: filter };
    }

    columnsStore.set({ columnFilters });
  };
};
