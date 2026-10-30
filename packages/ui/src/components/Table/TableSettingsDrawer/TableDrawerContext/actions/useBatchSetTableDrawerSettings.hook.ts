import { useBatchSetTableSettings } from '#ui/components/Table/contexts/TableConfig/columns/actions';
import { useReadTableDensity } from '#ui/components/Table/contexts/TableConfig/meta/useReadTableDensity.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';
import { buildBatchTableSettingsUpdate } from './buildBatchTableSettingsUpdate.util';

export const useBatchSetTableDrawerSettings = () => {
  const { columnsStore, densityStore, groupingStore, totalsPlacementStore } =
    useTableDrawerContextValue();
  const batchSetTableSettings = useBatchSetTableSettings();
  const readDensity = useReadTableDensity();

  return () => {
    const columnsState = columnsStore.get();
    const { density } = densityStore.get();

    batchSetTableSettings({
      density: density === readDensity().density ? undefined : density,
      grouping: groupingStore.get(),
      settings: buildBatchTableSettingsUpdate(columnsState),
      totalsPlacement: totalsPlacementStore.get().totalsPlacement,
    });
  };
};
