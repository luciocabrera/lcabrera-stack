import type { TableFocusState } from '#ui/components/Table/Table.types';

import { useReadTableDensity } from '#ui/components/Table/contexts/TableConfig/meta/useReadTableDensity.hook';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';

import { resolveGridFocusContext } from './utils';

export const useReadGridFocusContext = <
  TData extends Record<string, unknown>,
>() => {
  const { columnsStore, expansionStore, groupingStore } =
    useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue<TData>();
  const readDensity = useReadTableDensity();

  return (focusState: TableFocusState) =>
    resolveGridFocusContext({
      columnsState: columnsStore.get(),
      dataState: dataStore.get(),
      expansionState: expansionStore.get(),
      focusState,
      groupingState: groupingStore.get(),
      rowHeight: readDensity().rowHeight,
    });
};
