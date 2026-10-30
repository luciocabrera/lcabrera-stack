import { useReadTableDensity } from '#ui/components/Table/contexts/TableConfig/meta/useReadTableDensity.hook';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';
import { useTableContainerRef } from '#ui/components/Table/contexts/TableWrapper';

export const useGroupFoldStores = <TData extends Record<string, unknown>>() => {
  const { columnsStore, expansionStore } = useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue<TData>();
  const { focusStore } = useTableFocusContextValue();
  const readDensity = useReadTableDensity();

  return {
    columnsStore,
    containerRef: useTableContainerRef(),
    dataStore,
    expansionStore,
    focusStore,
    readRowHeight: () => readDensity().rowHeight,
  };
};
