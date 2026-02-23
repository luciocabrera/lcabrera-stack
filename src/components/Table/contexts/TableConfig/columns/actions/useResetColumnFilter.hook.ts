import type { ColumnFiltersState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '@/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';

/**
 * Hook to clear a single column filter
 */
export const useResetColumnFilter = () => {
  const { columnsStore, metaStore } = useTableConfigContextValue();
  const { dataStore } = useTableDataContextValue();
  const persistTableState = usePersistTableStateAction();

  const columnsState = columnsStore.get();
  const persistenceKey = metaStore.get()?.persistenceKey ?? '';

  return (columnKey: string) => {
    const current = columnsState?.columnFilters ?? {};
    const { [columnKey]: unusedFilter, ...rest } = current;
    void unusedFilter; // Explicitly mark as intentionally unused

    // Show loading feedback immediately
    dataStore.set({ isLoading: true });

    // Persist to falling back storage mechanism (cookie/localStorage)
    // writeStateSlice({
    //   persistenceKey,
    //   slice: 'columnFilters',
    //   storageType: 'cookie',
    //   value: rest,
    // });

    // setSearchParams((params) => {
    //   if (Object.keys(rest).length > 0) {
    //     params.set('filters', JSON.stringify(rest));
    //   } else {
    //     params.delete('filters');
    //   }
    //   return params;
    // });

    // Persist to cookie and sync URL params in one action
    persistTableState<ColumnFiltersState>({
      persistenceKey,
      searchParamKey: 'filters',
      searchParamValue:
        Object.keys(rest).length > 0 ? JSON.stringify(rest) : undefined,
      slice: 'columnFilters',
      valueSlice: rest,
    });

    columnsStore.set({ columnFilters: rest });
  };
};
