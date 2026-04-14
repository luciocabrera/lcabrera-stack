import type { ColumnPinningState } from '@/components/Table/Table.types';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useSetColumnPinning = <TData>() => {
  const { columnsStore } = useTableDrawerContextValue();

  return (columnPinning: ColumnPinningState<TData>) => {
    columnsStore.set({ columnPinning: columnPinning as ColumnPinningState });
  };
};
