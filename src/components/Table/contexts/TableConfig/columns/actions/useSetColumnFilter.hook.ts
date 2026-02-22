import type {
  ColumnFiltersState,
  DataKey,
} from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '@/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';

type SetColumnFilterArgs<TData> = {
  columnKey: DataKey<TData>;
  filter?: ColumnFilter | null;
};

/**
 * Hook to update a single column filter
 *
 * Persists the filter state to a cookie via server action (Set-Cookie header)
 * using useFetcher, ensuring the cookie is set server-side.
 */
export const useSetColumnFilter = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue();
  const persistTableState = usePersistTableStateAction();

  const columnsState = columnsStore.get();
  const persistenceKey = metaStore.get()?.persistenceKey ?? '';

  return ({ columnKey, filter }: SetColumnFilterArgs<TData>) => {
    const current = (columnsState?.columnFilters ??
      {}) as ColumnFiltersState<TData>;
    let columnFilters: ColumnFiltersState<TData>;
    if (filter === null || filter === undefined) {
      // TODO: Improve later, i don't like this pattern
      // Remove the filter by creating new object without it
      const { [columnKey]: unusedFilter, ...rest } = current;
      void unusedFilter; // Explicitly mark as intentionally unused
      columnFilters = rest as ColumnFiltersState<TData>;
    } else {
      columnFilters = { ...current, [columnKey]: filter };
    }

    // Show loading feedback immediately
    dataStore.set({ isLoading: true });

    // Persist to cookie and sync URL params in one action
    persistTableState<ColumnFiltersState<TData>>({
      persistenceKey,
      searchParamKey: 'filters',
      searchParamValue:
        Object.keys(columnFilters).length > 0
          ? JSON.stringify(columnFilters)
          : undefined,
      slice: 'columnFilters',
      valueSlice: columnFilters,
    });

    // Update table context state
    columnsStore.set({ columnFilters });
  };
};
