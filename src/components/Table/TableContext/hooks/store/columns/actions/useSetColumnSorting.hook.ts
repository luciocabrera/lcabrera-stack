import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

import type { Sorting } from '@/types/ui.types';

import { useTableConfigContextValue } from '@/components/Table/TableContext/hooks/useTableConfigContextValue.hook';
import { writeStateSlice } from '@/components/Table/utils/writeStateSlice.util';

export const useSetColumnSorting = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const [, setSearchParams] = useSearchParams();

  const persistenceKey = metaStore.get()?.persistenceKey ?? '';

  return useCallback(({ columnKey, direction }: Sorting<TData>) => {
    const columnsState = columnsStore.get();
    const sorting = columnsState?.sorting ?? [];
    const currentSort = sorting.find((s) => s.columnKey === columnKey);

    if (currentSort?.direction === direction) {
      // No change in sort
      return;
    }
    const newSorting = sorting
      .map((s) => {
        if (s.columnKey === columnKey) {
          return { columnKey, direction };
        }
        return s;
      })
      .filter((s) => s.direction); // Remove any with undefined direction

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
    columnsStore.set({ sorting: newSorting });
  }, [columnsStore, persistenceKey, setSearchParams]);
};
