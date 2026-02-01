import { useCallback } from 'react';

import type { ColumnSizingState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/TableContext/hooks/useTableConfigContextValue.hook';

/**
 * Hook to set entire column sizing state at once (bulk update)
 */
export const useSetColumnsSizing = () => {
  const { columnsStore } = useTableConfigContextValue();

  return useCallback(
    (columnSizing: ColumnSizingState) => {
      columnsStore.set({ columnSizing });
    },
    [columnsStore],
  );
};
