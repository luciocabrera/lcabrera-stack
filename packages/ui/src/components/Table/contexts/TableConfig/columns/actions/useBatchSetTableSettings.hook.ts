import type {
  TableGroupingState,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';

import { usePersistTableUiFlagsAction } from '#ui/components/Table/contexts/TableConfig/meta/actions/usePersistTableUiFlagsAction.hook';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';

import type { BatchTableSettingsUpdate } from './utils/resolveBatchTableSettingsUpdate.util';

import { usePersistTableStateAction } from './hooks/usePersistTableStateAction.hook';
import { resolveBatchSettingsPlan } from './utils';

type BatchSetTableSettingsArgs<TData> = {
  readonly grouping: TableGroupingState;
  readonly settings: BatchTableSettingsUpdate<TData>;
  readonly totalsPlacement: TableTotalsPlacement;
};

export const useBatchSetTableSettings = <TData = Record<string, unknown>>() => {
  const { columnsStore, groupingStore, metaStore } =
    useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue();
  const persistTableState = usePersistTableStateAction();
  const persistUiFlags = usePersistTableUiFlagsAction();

  return ({
    grouping,
    settings,
    totalsPlacement,
  }: BatchSetTableSettingsArgs<TData>) => {
    const plan = resolveBatchSettingsPlan<TData>({
      columnsState: columnsStore.get(),
      currentGrouping: groupingStore.get(),
      data: dataStore.get().data,
      grouping,
      metaState: metaStore.get(),
      settings,
      totalsPlacement,
    });
    const didPersist = persistTableState(plan.persistRequest);

    if (!didPersist) {
      return;
    }

    if (plan.hasLiveQueryChanged) {
      dataStore.set({ isLoading: true });
    }

    columnsStore.set(plan.resolvedUpdate);

    if (plan.committedGrouping !== undefined) {
      groupingStore.set(plan.committedGrouping);
    }

    if (plan.separateUiFlags !== undefined) {
      persistUiFlags(plan.separateUiFlags);
    }

    if (plan.closesSettings) {
      metaStore.set(plan.nextStatePatch);
    }
  };
};
