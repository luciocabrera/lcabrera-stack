import type { ColumnFiltersState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '@/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';
import { serializeFiltersToURL } from '@/utils/urlState';

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

    // Persist to cookie and sync URL params in one action
    persistTableState<ColumnFiltersState>({
      persistenceKey,
      searchParamKey: 'filters',
      searchParamValue: serializeFiltersToURL(rest),
      slice: 'columnFilters',
      valueSlice: rest,
    });

    columnsStore.set({ columnFilters: rest });
  };
};
