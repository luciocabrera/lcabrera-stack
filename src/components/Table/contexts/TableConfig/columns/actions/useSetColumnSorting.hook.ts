import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

import type { Sorting } from '@/types/ui.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { getNormalizedColummns } from '@/components/Table/utils';
import { writeStateSlice } from '@/components/Table/utils/writeStateSlice.util';

export const useSetColumnSorting = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const [, setSearchParams] = useSearchParams();

  const persistenceKey = metaStore.get()?.persistenceKey ?? '';

  return useCallback(
    ({ columnKey, direction }: Sorting<TData>) => {
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

      writeStateSlice({
        persistenceKey,
        slice: 'sorting',
        storageType: 'cookie',
        value: newSorting,
      });
      setSearchParams((params) => {
        if (newSorting.length > 0) {
          params.set('sort', JSON.stringify(newSorting));
        } else {
          params.delete('sort');
        }
        return params;
      });
      columnsStore.set({ normalizedColumns, sorting: newSorting });
    },
    [columnsStore, persistenceKey, setSearchParams],
  );
};
