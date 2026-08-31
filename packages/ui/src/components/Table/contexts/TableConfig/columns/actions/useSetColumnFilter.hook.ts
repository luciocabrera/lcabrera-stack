import type { DataKey } from '#ui/components/Table/Table.types';
import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';

import { usePersistTableStateAction } from './hooks/usePersistTableStateAction.hook';
import { resolveColumnFilterUpdate } from './utils';

type SetColumnFilterArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly filter?: ColumnFilter;
};

export const useSetColumnFilter = <TData>() => {
  const { columnsStore } = useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue();
  const persistTableState = usePersistTableStateAction();

  return ({ columnKey, filter }: SetColumnFilterArgs<TData>) => {
    const columnsState = columnsStore.get();

    const { columnFilters, persistenceEntry } =
      resolveColumnFilterUpdate<TData>({
        columnFiltersState: columnsState?.columnFilters,
        columnKey,
        filter,
      });

    if (!persistTableState(persistenceEntry)) return;

    dataStore.set({ isLoading: true });

    columnsStore.set({ columnFilters });
  };
};
