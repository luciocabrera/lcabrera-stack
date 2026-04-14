import type { Sorting } from '@/types/ui.types';

import type { SortingState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '@/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';
import { getNormalizedColumns } from '@/components/Table/utils';
import { serializeSortingToURL } from '@/utils/urlState';

export const useSetColumnSorting = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue();
  const persistTableState = usePersistTableStateAction();

  return ({ columnKey, direction }: Sorting<TData>) => {
    if (columnKey === 'actions') return;

    const columnsState = columnsStore.get();
    const persistenceKey = metaStore.get()?.persistenceKey ?? '';
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

    const normalizedColumns = getNormalizedColumns({
      columns: columnsState?.columns ?? [],
      sorting: newSorting,
    });

    // Show loading feedback immediately
    dataStore.set({ isLoading: true });

    // Persist to cookie and sync URL params in one action
    persistTableState({
      persistenceKey,
      searchParamKey: 'sort',
      searchParamValue: serializeSortingToURL(newSorting as SortingState),
      slice: 'sorting',
      valueSlice: newSorting,
    });

    // Update table context state
    columnsStore.set({ normalizedColumns, sorting: newSorting });
  };
};
