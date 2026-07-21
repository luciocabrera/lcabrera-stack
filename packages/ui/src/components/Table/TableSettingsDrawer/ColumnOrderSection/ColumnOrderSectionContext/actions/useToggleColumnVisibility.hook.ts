import type { ColumnVisibilityState } from '@lcabrera/ui/components/Table/Table.types';

import { useTableConfigContextValue } from '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDrawerContextValue } from '@lcabrera/ui/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

type UseToggleColumnVisibilityArgs = {
  readonly columnKey: string;
  readonly isVisible: boolean;
};
/**
 * Hook to toggle a column's visibility.
 * No-op for static columns.
 */
export const useToggleColumnVisibility = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();

  return ({ columnKey, isVisible }: UseToggleColumnVisibilityArgs) => {
    const tableColumnsState = tableColumnsStore.get();
    const column = tableColumnsState?.normalizedColumns[columnKey];

    if (column?.isStatic) return;

    const columnVisibility =
      drawerColumnsStore.get()?.columnVisibility ??
      (new Set() as ColumnVisibilityState);
    const newVisibility = new Set(columnVisibility);
    if (isVisible) {
      newVisibility.delete(columnKey);
    } else {
      newVisibility.add(columnKey);
    }
    drawerColumnsStore.set({ columnVisibility: newVisibility });
  };
};
