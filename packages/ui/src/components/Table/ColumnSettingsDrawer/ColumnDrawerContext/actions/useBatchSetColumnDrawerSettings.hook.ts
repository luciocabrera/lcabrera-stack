import { useColumnDrawerContextValue } from '#ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';
import { useBatchSetColumnSettings } from '#ui/components/Table/contexts/TableConfig/columns/actions';

export const useBatchSetColumnDrawerSettings = <TData>() => {
  const { columnStore } = useColumnDrawerContextValue<TData>();
  const batchSetColumnSettings = useBatchSetColumnSettings<TData>();

  return () => {
    const columnState = columnStore.get();

    if (!columnState) return;

    const { columnFilter, columnKey, columnPinning, columnSizing, sorting } =
      columnState;

    batchSetColumnSettings({
      columnFilter,
      columnKey,
      columnPinning,
      columnSizing,
      sorting,
    });
  };
};
