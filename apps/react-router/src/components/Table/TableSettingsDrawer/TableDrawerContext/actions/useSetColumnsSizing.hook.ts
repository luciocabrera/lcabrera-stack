import type { ColumnSizingState } from "@/components/Table/Table.types";

import { useTableDrawerContextValue } from "../useTableDrawerContextValue.hook.ts";

/**
 * Hook to set entire column sizing state at once (bulk update)
 */
export const useSetColumnsSizing = () => {
  const { columnsStore } = useTableDrawerContextValue();

  return (columnSizing: ColumnSizingState) => {
    columnsStore.set({ columnSizing });
  };
};
