import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';
import { useTableContainerRef } from '#ui/components/Table/contexts/TableWrapper';
import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';

import type { EnterTableGridArgs } from './useEnterTableGrid.types';

import { useReadGridFocusContext } from './useReadGridFocusContext.hook';
import { commitTableFocusTarget } from './utils';

export const useEnterTableGrid = <TData extends Record<string, unknown>>() => {
  const { focusStore } = useTableFocusContextValue();
  const readGridFocusContext = useReadGridFocusContext<TData>();
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

    const {
      columnKeys,
      columns,
      data,
      focusedRowIndex: rowIndex = 0,
      rowHeight,
    } = readGridFocusContext(focusState);

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
