import { useReadTableDensity } from '#ui/components/Table/contexts/TableConfig/meta/useReadTableDensity.hook';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';
import { buildBatchTableSettingsUpdate } from './buildBatchTableSettingsUpdate.util';

export const useResetTableSettings = () => {
  const { columnsStore, groupingStore } = useTableConfigContextValue();
  const {
    columnsStore: columnsDrawerStore,
    densityStore: densityDrawerStore,
    groupingStore: groupingDrawerStore,
  } = useTableDrawerContextValue();
  const readDensity = useReadTableDensity();

  return () => {
    const columnsState = columnsStore.get();

    columnsDrawerStore.set(buildBatchTableSettingsUpdate(columnsState));
    groupingDrawerStore.set(groupingStore.get());
    densityDrawerStore.set({ density: readDensity().density });
  };
};
