import { useColumnDrawerContextValue } from '#ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';
import { toDeclaredColumnKey } from '#ui/components/Table/contexts/TableConfig/columns/actions/utils/toDeclaredColumnKey.util';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { getColumnPinSide } from '#ui/components/Table/utils';
import { logger } from '#ui/utils/logger';

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

    const columnsState = columnsStore.get();

    const columnPinning = getColumnPinSide({
      columnKey: toDeclaredColumnKey({
        columnKey,
        columns: columnsState?.columns ?? [],
      }),
      pinning: columnsState?.columnPinning,
    });

    columnStore.set({ columnPinning });
  };
};
