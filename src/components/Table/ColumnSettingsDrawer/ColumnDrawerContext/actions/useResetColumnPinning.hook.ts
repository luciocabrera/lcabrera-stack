import { useColumnDrawerContextValue } from '@/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';
import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

/**
 * Resets the column pinning in the drawer to match the current table state.
 */
export const useResetColumnPinning = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnStore } = useColumnDrawerContextValue();

  return () => {
    const columnKey = columnStore.get()?.columnKey;

    if (!columnKey) {
      console.warn(
        '[useResetColumnPinning] No columnKey found in column drawer store.',
      );
      return;
    }

    const currentPinning = columnsStore.get()?.columnPinning;
    const columnPinning = currentPinning?.left.includes(columnKey)
      ? 'left'
      : currentPinning?.right.includes(columnKey)
        ? 'right'
        : undefined;

    columnStore.set({ columnPinning });
  };
};
