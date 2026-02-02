import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

import type { SortingState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/TableContext/hooks/useTableConfigContextValue.hook';
import { writeStateSlice } from '@/components/Table/utils/writeStateSlice.util';

/**
 * Hook to update sorting state
 */
export const useSetColumnsSortings = () => {
  const { columnsStore, metaStore } = useTableConfigContextValue();
  const [, setSearchParams] = useSearchParams();

  const persistenceKey = metaStore.get()?.persistenceKey ?? '';

  return useCallback(
    (sorting: SortingState) => {
      writeStateSlice({
        persistenceKey,
        slice: 'sorting',
        storageType: 'cookie',
        value: sorting,
      });
      setSearchParams((params) => {
        if (Object.keys(sorting).length > 0) {
          params.set('sort', JSON.stringify(sorting));
        } else {
          params.delete('sort');
        }
        return params;
      });
      columnsStore.set({ sorting });
    },
    [columnsStore, persistenceKey, setSearchParams],
  );
};
