import { useColumnDrawerContextValue } from "@/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook";
import { useTableConfigContextValue } from "@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook";

/**
 * Clears all column drawer settings (filter, sizing, sorting) to undefined.
 * Optionally closes the drawer when shouldCloseDrawer is true.
 */
export const useClearAllColumnDrawerSettings = () => {
  const { columnStore } = useColumnDrawerContextValue();
  const { metaStore } = useTableConfigContextValue();

  return (shouldCloseDrawer?: boolean) => {
    const columnKey = columnStore.get()?.columnKey;

    if (!columnKey) return;

    columnStore.set({
      columnFilter: undefined,
      columnKey,
      columnPinning: undefined,
      columnSizing: undefined,
      sorting: undefined,
    });

    if (shouldCloseDrawer) {
      metaStore.set({ isColumnSettingsOpen: false });
    }
  };
};
