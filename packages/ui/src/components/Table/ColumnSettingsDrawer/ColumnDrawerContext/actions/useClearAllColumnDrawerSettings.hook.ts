import { useColumnDrawerContextValue } from '@repo/ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';
import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { persistTableMetaUiState } from '@repo/ui/components/Table/utils';

import { getClosedColumnSettingsStatePatch } from '../utils';

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
      const metaState = metaStore.get();
      const nextStatePatch = getClosedColumnSettingsStatePatch({ metaState });

      persistTableMetaUiState({
        currentState: metaState,
        nextStatePatch,
      });
      metaStore.set(nextStatePatch);
    }
  };
};
