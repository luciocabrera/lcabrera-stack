import { useColumnDrawerContextValue } from '@repo/ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';

import { useCloseColumnSettingsDrawer } from './useCloseColumnSettingsDrawer.hook';

/**
 * Clears all column drawer settings (filter, sizing, sorting) to undefined.
 * Optionally closes the drawer when shouldCloseDrawer is true.
 */
export const useClearAllColumnDrawerSettings = () => {
  const { columnStore } = useColumnDrawerContextValue();
  const closeColumnSettingsDrawer = useCloseColumnSettingsDrawer();

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

    if (shouldCloseDrawer) closeColumnSettingsDrawer();
  };
};
