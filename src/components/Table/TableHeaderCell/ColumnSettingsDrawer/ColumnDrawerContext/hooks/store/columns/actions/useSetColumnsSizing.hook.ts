import type { ColumnSizingState } from '@/components/Table/Table.types';

import { useColumnDrawerContextValue } from '../../../useColumnDrawerContextValue.hook';

/**
 * Hook to set entire column sizing state at once (bulk update)
 */
export const useSetColumnsSizing = () => {
  const { columnStore } = useColumnDrawerContextValue();

  return (columnSizing: ColumnSizingState) => {
    columnStore.set({ columnSizing });
  };
};
