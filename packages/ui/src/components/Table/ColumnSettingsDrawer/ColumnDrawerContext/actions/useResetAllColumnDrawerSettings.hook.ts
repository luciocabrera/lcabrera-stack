import { useColumnDrawerContextValue } from '@lcabrera/ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';
import { getTableColumnDrawerState } from '@lcabrera/ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/utils';
import { useTableConfigContextValue } from '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useCloseColumnSettingsDrawer } from './useCloseColumnSettingsDrawer.hook';

/**
 * Resets all column drawer settings from the current table state.
 * Optionally closes the drawer when shouldCloseDrawer is true.
 */
export const useResetAllColumnDrawerSettings = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnStore } = useColumnDrawerContextValue();
  const closeColumnSettingsDrawer = useCloseColumnSettingsDrawer();

  return (shouldCloseDrawer?: boolean) => {
    const columnKey = columnStore.get()?.columnKey;

    if (!columnKey) return;

    const columnsState = columnsStore.get();
    const nextDrawerState = getTableColumnDrawerState({
      columnKey,
      columnsState,
    });

    columnStore.set(nextDrawerState);

    if (shouldCloseDrawer) closeColumnSettingsDrawer();
  };
};
