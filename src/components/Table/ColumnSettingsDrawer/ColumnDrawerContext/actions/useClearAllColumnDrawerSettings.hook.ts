import { useColumnDrawerContextValue } from '@/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';

/**
 * Clears all column drawer settings (filter, sizing, sorting) without closing the drawer.
 */
export const useClearAllColumnDrawerSettings = () => {
  const { columnStore } = useColumnDrawerContextValue();

  return () => {
    const columnKey = columnStore.get()?.columnKey;

    if (!columnKey) return;

    columnStore.set({
      columnFilter: undefined,
      columnKey,
      columnSizing: undefined,
      sorting: undefined,
    });
  };
};
