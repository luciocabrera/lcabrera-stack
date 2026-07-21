import { useColumnDrawerContextValue } from '@lcabrera/ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';
import { useTableConfigContextValue } from '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { getColumnPinSide } from '@lcabrera/ui/components/Table/utils';
import { logger } from '@lcabrera/ui/utils/logger';

/**
 * Resets the column pinning in the drawer to match the current table state.
 */
export const useResetColumnPinning = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnStore } = useColumnDrawerContextValue();

  return () => {
    const columnKey = columnStore.get()?.columnKey;

    if (!columnKey) {
      logger.warn(
        '[useResetColumnPinning] No columnKey found in column drawer store.',
      );
      return;
    }

    const columnPinning = getColumnPinSide({
      columnKey,
      pinning: columnsStore.get()?.columnPinning,
    });

    columnStore.set({ columnPinning });
  };
};
