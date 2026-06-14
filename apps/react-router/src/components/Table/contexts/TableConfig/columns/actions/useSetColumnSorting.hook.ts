import type { Sorting } from '@/types/ui.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '@/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';

import { resolveColumnSortingUpdate } from './utils';

export const useSetColumnSorting = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue();
  const persistTableState = usePersistTableStateAction();

  return ({ columnKey, direction }: Sorting<TData>) => {
    const columnsState = columnsStore.get();
    const result = resolveColumnSortingUpdate<TData>({
      columns: columnsState?.columns ?? [],
      existingSorting: columnsState?.sorting,
      persistenceKey: metaStore.get()?.persistenceKey ?? '',
      sort: { columnKey, direction },
    });

    if (result.kind !== 'updated') {
      return;
    }

    // Show loading feedback immediately
    dataStore.set({ isLoading: true });

    // Persist to cookie and sync URL params in one action
    persistTableState(result.persistenceEntry);

    // Update table context state
    columnsStore.set({
      normalizedColumns: result.normalizedColumns,
      sorting: result.sorting,
    });
  };
};
