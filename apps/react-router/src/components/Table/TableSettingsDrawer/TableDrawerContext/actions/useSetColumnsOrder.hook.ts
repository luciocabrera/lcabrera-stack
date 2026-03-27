import type { ColumnOrderState } from "@/components/Table/Table.types";

import { useTableDrawerContextValue } from "../useTableDrawerContextValue.hook.ts";

/**
 * Hook to update column order
 */
export const useSetColumnsOrder = <TData>() => {
  const { columnsStore } = useTableDrawerContextValue();

  return (columnOrder: ColumnOrderState<TData>) => {
    columnsStore.set({ columnOrder });
  };
};
