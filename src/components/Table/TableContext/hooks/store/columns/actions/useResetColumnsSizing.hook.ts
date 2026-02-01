import { useCallback } from 'react';

import { useTableConfigContextValue } from '@/components/Table/TableContext/hooks/useTableConfigContextValue.hook';

/**
 * Hook to reset all column sizing
 */
export const useResetColumnsSizing = () => {
  const { columnsStore } = useTableConfigContextValue();

  return useCallback(() => {
    columnsStore.set({ columnSizing: {} });
  }, [columnsStore]);
};
