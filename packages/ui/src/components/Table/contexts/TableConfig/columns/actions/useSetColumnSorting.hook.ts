import type { Sorting } from '#ui/types/ui.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';

import { usePersistTableStateAction } from './hooks/usePersistTableStateAction.hook';
import { getPinningActionContext, resolveColumnSortingUpdate } from './utils';

export const useSetColumnSorting = <TData>() => {
  const { columnsStore, groupingStore, metaStore } =
    useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue();
  const persistTableState = usePersistTableStateAction();

  return ({ columnKey, direction }: Sorting<TData>) => {
    const {
      columnOrder,
      columnPinning,
      columns,
      columnSizing,
      columnVisibility,
      drawersSyncNonce,
      sorting: existingSorting,
    } = getPinningActionContext<TData>({ columnsStore, metaStore });
    const grouping = groupingStore.get();

    const result = resolveColumnSortingUpdate<TData>({
      aggregates: grouping.aggregates,
      columnOrder,
      columnPinning,
      columns,
      columnSizing,
      columnVisibility,
      existingSorting,
      groupingKeys: grouping.keys,
      sort: { columnKey, direction },
    });

    if (result.kind !== 'updated') return;

    if (!persistTableState(result.persistenceEntry)) return;

    dataStore.set({ isLoading: true });

    columnsStore.set({ ...result.viewState, sorting: result.sorting });

    metaStore.set({ drawersSyncNonce: drawersSyncNonce + 1 });
  };
};
