import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';
import { buildBatchTableSettingsUpdate } from './buildBatchTableSettingsUpdate.util';

export const useResetTableSettings = () => {
  const { columnsStore, groupingStore, metaStore } =
    useTableConfigContextValue();
  const {
    columnsStore: columnsDrawerStore,
    densityStore: densityDrawerStore,
    groupingStore: groupingDrawerStore,
  } = useTableDrawerContextValue();

  return () => {
    const columnsState = columnsStore.get();
    const { density, headerDensity, titleDensity } = metaStore.get();

    columnsDrawerStore.set(buildBatchTableSettingsUpdate(columnsState));
    groupingDrawerStore.set(groupingStore.get());
    densityDrawerStore.set({ density, headerDensity, titleDensity });
  };
};
