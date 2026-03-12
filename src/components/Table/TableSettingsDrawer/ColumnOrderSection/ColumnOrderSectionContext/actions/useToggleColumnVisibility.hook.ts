import type { ColumnVisibilityState } from '@/components/Table/Table.types';

import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

/**
 * Hook to toggle a column's visibility.
 */
export const useToggleColumnVisibility = () => {
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();

  return ({
    columnKey,
    isVisible,
  }: {
    columnKey: string;
    isVisible: boolean;
  }) => {
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
