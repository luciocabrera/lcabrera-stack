import type { ColumnSizingState } from '@repo/ui/components/Table/Table.types';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

/**
 * Hook to set entire column sizing state at once (bulk update)
 */
export const useSetColumnsSizing = () => {
  const { columnsStore } = useTableDrawerContextValue();

  return (columnSizing: ColumnSizingState) => {
    columnsStore.set({ columnSizing });
  };
};
