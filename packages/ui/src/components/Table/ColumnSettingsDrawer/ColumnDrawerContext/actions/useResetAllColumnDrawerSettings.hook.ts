import { useColumnDrawerContextValue } from '#ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';
import { getTableColumnDrawerState } from '#ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/utils';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useCloseColumnSettingsDrawer } from './useCloseColumnSettingsDrawer.hook';

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
