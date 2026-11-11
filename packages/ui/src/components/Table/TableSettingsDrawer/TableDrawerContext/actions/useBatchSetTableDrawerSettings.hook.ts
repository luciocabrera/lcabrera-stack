import { useBatchSetTableSettings } from '#ui/components/Table/contexts/TableConfig/columns/actions';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';
import { buildBatchTableSettingsUpdate } from './buildBatchTableSettingsUpdate.util';
import { toTableDensityPatch } from './toTableDensityPatch.util';

export const useBatchSetTableDrawerSettings = () => {
  const { columnsStore, densityStore, groupingStore, totalsPlacementStore } =
    useTableDrawerContextValue();
  const { metaStore } = useTableConfigContextValue();
  const batchSetTableSettings = useBatchSetTableSettings();

  return () => {
    const columnsState = columnsStore.get();

    batchSetTableSettings({
      densityPatch: toTableDensityPatch({
        current: metaStore.get(),
        staged: densityStore.get(),
      }),
      grouping: groupingStore.get(),
      settings: buildBatchTableSettingsUpdate(columnsState),
      totalsPlacement: totalsPlacementStore.get().totalsPlacement,
    });
  };
};
