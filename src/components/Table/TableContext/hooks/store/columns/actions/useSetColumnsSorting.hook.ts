import { useCallback } from 'react';

import type { SortingState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/TableContext/hooks/useTableConfigContextValue.hook';

/**
 * Hook to update sorting state
 */
export const useSetColumnsSorting = () => {
  const { columnsStore } = useTableConfigContextValue();

  return useCallback(
    (sorting: SortingState) => {
      columnsStore.set({ sorting });
    },
    [columnsStore],
  );
};
