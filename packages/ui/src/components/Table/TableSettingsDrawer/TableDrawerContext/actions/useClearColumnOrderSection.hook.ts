import type {
  ColumnOrderState,
  ColumnPinningState,
} from '#ui/components/Table/Table.types';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useClearColumnOrderSection = () => {
  const { columnsStore } = useTableDrawerContextValue();

  return () => {
    columnsStore.set({
      columnOrder: [] as ColumnOrderState,
      columnPinning: { left: [], right: [] } as ColumnPinningState,
      columnVisibility: new Set(),
    });
  };
};
