import { useColumnDrawerContextValue } from '#ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { getColumnPinSide } from '#ui/components/Table/utils';
import { logger } from '#ui/utils/logger';

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
