import type { Sorting } from '@/types/ui.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '@/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';
import { getNormalizedColummns } from '@/components/Table/utils';

export const useSetColumnSorting = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue();
  const persistTableState = usePersistTableStateAction();

  const persistenceKey = metaStore.get()?.persistenceKey ?? '';

  return ({ columnKey, direction }: Sorting<TData>) => {
    const columnsState = columnsStore.get();
    const sorting = columnsState?.sorting ?? [];
    const currentSort = sorting.find((s) => s.columnKey === columnKey);
    const hasCurrentSort = currentSort !== undefined;

    if (currentSort?.direction === direction) {
      // No change in sort
      return;
    }

    let newSorting = [...sorting];

    if (hasCurrentSort) {
      newSorting =
        direction === undefined
          ? sorting.filter((s) => s.columnKey !== columnKey)
          : sorting.map((s) => {
              if (s.columnKey === columnKey) {
                return { columnKey, direction };
              }

              return s;
            });
    } else if (direction !== undefined) {
      newSorting = [...sorting, { columnKey, direction }];
    }

    const normalizedColumns = getNormalizedColummns({
      columns: columnsState?.columns ?? [],
      sorting: newSorting,
    });

    // Show loading feedback immediately
    dataStore.set({ isLoading: true });

    // Persist to cookie and sync URL params in one action
    persistTableState({
      persistenceKey,
      searchParamKey: 'sort',
      searchParamValue:
        newSorting.length > 0 ? JSON.stringify(newSorting) : undefined,
      slice: 'sorting',
      valueSlice: newSorting,
    });

    // Update table context state
    columnsStore.set({ normalizedColumns, sorting: newSorting });
  };
};
