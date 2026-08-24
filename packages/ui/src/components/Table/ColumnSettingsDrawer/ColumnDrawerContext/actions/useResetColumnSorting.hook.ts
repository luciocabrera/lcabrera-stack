import { useColumnDrawerContextValue } from '#ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { logger } from '#ui/utils/logger';

export const useResetColumnSorting = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnStore } = useColumnDrawerContextValue();

  return () => {
    const columnState = columnStore.get();
    const columnKey = columnState?.columnKey;

    if (!columnKey) {
      logger.warn(
        '[useResetColumnSorting] No columnKey found in column drawer store.',
      );
      return;
    }

    const sorting = columnsStore
      .get()
      ?.sorting.find((sort) => sort.columnKey === columnKey)?.direction;

    columnStore.set({ sorting });
  };
};
