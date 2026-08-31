import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { serializeSortingToURL } from '#ui/utils/urlState/serializeSortingToURL.util';

import { usePersistTableStateAction } from '../../columns/actions/hooks/usePersistTableStateAction.hook';
import { applyGroupingReducer, resolveGroupingColumnsPatch } from './utils';

export const useSetTableGrouping = () => {
  const { columnsStore, groupingStore, metaStore } =
    useTableConfigContextValue();
  const { dataStore } = useTableDataContextValue();
  const persistTableState = usePersistTableStateAction();

  return (
    deriveNextGrouping: (current: TableGroupingState) => TableGroupingState,
  ) => {
    const result = applyGroupingReducer({
      deriveNextGrouping,
      existingGrouping: groupingStore.get(),
      hasDefaultGrouping: metaStore.get()?.hasDefaultGrouping === true,
    });

    if (result.kind !== 'updated') return;

    const columnsState = columnsStore.get();
    const columnsPatch = resolveGroupingColumnsPatch({
      aggregates: result.grouping.aggregates,
      columnsState,
      groupingKeys: result.grouping.keys,
    });

    const entries =
      columnsPatch.sorting === columnsState.sorting
        ? [result.persistenceEntry]
        : [
            result.persistenceEntry,
            {
              searchParamKey: 'sorting',
              searchParamValue: serializeSortingToURL(columnsPatch.sorting),
            },
          ];

    if (!persistTableState(entries)) return;

    dataStore.set({ isLoading: true });
    columnsStore.set(columnsPatch);
    groupingStore.set(result.grouping);
  };
};
