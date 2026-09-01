import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';
import { useTableContainerRef } from '#ui/components/Table/contexts/TableWrapper';
import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';

import type { EnterTableGridArgs } from './useEnterTableGrid.types';

import { commitTableFocusTarget, resolveGridFocusContext } from './utils';

export const useEnterTableGrid = <TData extends Record<string, unknown>>() => {
  const { focusStore } = useTableFocusContextValue();
  const { columnsStore, expansionStore, groupingStore, metaStore } =
    useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue<TData>();
  const containerRef = useTableContainerRef();

  return ({ isGridElement }: EnterTableGridArgs) => {
    const focusState = focusStore.get();

    const markFocused = () => {
      if (!focusState.isGridFocused) focusStore.set({ isGridFocused: true });
    };

    if (!isGridElement) {
      markFocused();

      return;
    }

    const { columnKeys, columns, data, focusedRowIndex, rowHeight } =
      resolveGridFocusContext({
        columnsState: columnsStore.get(),
        dataState: dataStore.get(),
        expansionState: expansionStore.get(),
        focusState,
        groupingState: groupingStore.get(),
        metaState: metaStore.get(),
      });

    const rowIndex = focusedRowIndex ?? 0;
    const targetRow = data[rowIndex];
    const columnKey =
      focusState.columnKey !== undefined &&
      columnKeys.includes(focusState.columnKey)
        ? focusState.columnKey
        : columnKeys[0];

    if (targetRow === undefined || columnKey === undefined) {
      markFocused();

      return;
    }

    commitTableFocusTarget({
      columnKey,
      container: containerRef.current,
      focusStore,
      rowHeight,
      rowIndex,
      rowKey: resolveRowKey({ columns, index: rowIndex, row: targetRow }),
    });
  };
};
