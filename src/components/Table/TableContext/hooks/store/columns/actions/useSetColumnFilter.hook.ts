import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

import type { ColumnFiltersState } from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';

import { useTableConfigContextValue } from '@/components/Table/TableContext/hooks/useTableConfigContextValue.hook';
import { writeStateSlice } from '@/components/Table/utils';

type SetColumnFilterArgs = {
  columnKey: string;
  filter?: ColumnFilter | null;
};

/**
 * Hook to update a single column filter
 */
export const useSetColumnFilter = () => {
  const { columnsStore, metaStore } = useTableConfigContextValue();
  const [, setSearchParams] = useSearchParams();

  const columnsState = columnsStore.get();
  const persistenceKey = metaStore.get()?.persistenceKey ?? '';

  return useCallback(
    ({ columnKey, filter }: SetColumnFilterArgs) => {
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

      // Persist to falling back storage mechanism (cookie/localStorage)
      writeStateSlice({
        persistenceKey,
        slice: 'columnFilters',
        storageType: 'cookie',
        value: columnFilters,
      });

      // Update URL search params
      setSearchParams((params) => {
        if (Object.keys(columnFilters).length > 0) {
          params.set('filters', JSON.stringify(columnFilters));
        } else {
          params.delete('filters');
        }
        return params;
      });

      // Update table context state
      columnsStore.set({ columnFilters });
    },
    [
      columnsState?.columnFilters,
      persistenceKey,
      setSearchParams,
      columnsStore,
    ],
  );
};
