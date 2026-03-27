import type { SortingState } from "@/components/Table/Table.types";

import { useTableConfigContextValue } from "@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook";

import { useTableDrawerContextValue } from "../useTableDrawerContextValue.hook.ts";

/**
 * Hook to reset sorting to the original table configuration state
 */
export const useResetSorting = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnsStore: columnsDrawerStore } = useTableDrawerContextValue();

  return () => {
    const columnsState = columnsStore.get();

    columnsDrawerStore.set({
      sorting: columnsState?.sorting ?? ([] as SortingState),
    });
  };
};
