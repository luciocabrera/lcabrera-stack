import type { ColumnPinningState } from '@/components/Table/Table.types';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useClearColumnOrderSection = () => {
  const { columnsStore } = useTableDrawerContextValue();

  return () => {
    columnsStore.set({
      columnPinning: { left: [], right: [] } as ColumnPinningState,
      columnVisibility: new Set(),
    });
  };
};
