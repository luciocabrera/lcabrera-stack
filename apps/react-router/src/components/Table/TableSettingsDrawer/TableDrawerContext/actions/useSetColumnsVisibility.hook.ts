import type { ColumnVisibilityState } from '@/components/Table/Table.types';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook.ts';

export const useSetColumnsVisibility = <TData>() => {
  const { columnsStore } = useTableDrawerContextValue();

  return (columnVisibility: ColumnVisibilityState<TData>) => {
    columnsStore.set({ columnVisibility });
  };
};
