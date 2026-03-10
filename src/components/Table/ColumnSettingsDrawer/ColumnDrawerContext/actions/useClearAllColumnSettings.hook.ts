import { useColumnDrawerContextValue } from '@/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';
import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

/**
 * Clears all column settings (filter, sizing, sorting) to undefined.
 */
export const useClearAllColumnSettings = () => {
  const { columnStore } = useColumnDrawerContextValue();
  const { metaStore } = useTableConfigContextValue();
  return () => {
    const columnKey = columnStore.get()?.columnKey;

    if (!columnKey) {
      console.warn(
        '[useClearAllColumnSettings] No columnKey found in column drawer store.',
      );
      return;
    }

    columnStore.set({
      columnFilter: undefined,
      columnKey,
      columnPinning: undefined,
      columnSizing: undefined,
      sorting: undefined,
    });
    metaStore.set({ isColumnSettingsOpen: false });
  };
};
