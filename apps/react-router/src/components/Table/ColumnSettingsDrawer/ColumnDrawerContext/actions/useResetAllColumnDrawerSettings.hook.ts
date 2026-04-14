import { useColumnDrawerContextValue } from '@/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';
import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { getTableColumnDrawerState } from '@/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/utils';

/**
 * Resets all column drawer settings from the current table state.
 * Optionally closes the drawer when shouldCloseDrawer is true.
 */
export const useResetAllColumnDrawerSettings = () => {
  const { columnsStore, metaStore } = useTableConfigContextValue();
  const { columnStore } = useColumnDrawerContextValue();

  return (shouldCloseDrawer?: boolean) => {
    const columnKey = columnStore.get()?.columnKey;

    if (!columnKey) return;

    const columnsState = columnsStore.get();
    const nextDrawerState = getTableColumnDrawerState({
      columnKey,
      columnsState,
    });

    columnStore.set(nextDrawerState);

    if (shouldCloseDrawer) {
      metaStore.set({ isColumnSettingsOpen: false });
    }
  };
};
