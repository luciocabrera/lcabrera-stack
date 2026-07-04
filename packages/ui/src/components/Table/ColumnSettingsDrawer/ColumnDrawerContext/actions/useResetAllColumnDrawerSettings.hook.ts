import { useColumnDrawerContextValue } from '@repo/ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';
import {
  closeColumnSettingsDrawer,
  getTableColumnDrawerState,
} from '@repo/ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/utils';
import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

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
      closeColumnSettingsDrawer({ metaStore });
    }
  };
};
