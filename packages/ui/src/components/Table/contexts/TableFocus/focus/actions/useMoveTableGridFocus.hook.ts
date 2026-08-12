import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';
import { useTableContainerRef } from '#ui/components/Table/contexts/TableWrapper';
import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';

import type { MoveTableGridFocusArgs } from './useMoveTableGridFocus.types';

import {
  commitTableFocusTarget,
  getGridPageRows,
  resolveGridFocusContext,
  resolveGridFocusMove,
} from './utils';

/**
 * Moves the grid's single tab stop in response to a key, and answers whether
 * the key was one the grid claims — which is what the caller preventDefaults
 * on, so an unclaimed key still scrolls the page.
 *
 * The move is computed against the **loaded rows**, not the rendered window: a
 * target outside the window is a scroll away, not an impossibility, and
 * `commitTableFocusTarget` brings it in. That is the point of holding focus as
 * data (ADR-062) — the old row can be unmounted and the new one not yet
 * mounted, and the move still lands.
 */
export const useMoveTableGridFocus = <
  TData extends Record<string, unknown>,
>() => {
  const { focusStore } = useTableFocusContextValue();
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue<TData>();
  const containerRef = useTableContainerRef();

  return ({ isRangeModifier, key }: MoveTableGridFocusArgs) => {
    const focusState = focusStore.get();
    const { columnKeys, columns, data, focusedRowIndex, rowHeight } =
      resolveGridFocusContext({
        columnsState: columnsStore.get(),
        dataState: dataStore.get(),
        focusState,
        metaState: metaStore.get(),
      });

    const currentColumnIndex =
      focusState.columnKey === undefined
        ? -1
        : columnKeys.indexOf(focusState.columnKey);

    const next = resolveGridFocusMove({
      columnCount: columnKeys.length,
      columnIndex: currentColumnIndex,
      hasFocusedCell: focusedRowIndex !== undefined && currentColumnIndex >= 0,
      isRangeModifier,
      key,
      pageRows: getGridPageRows({
        container: containerRef.current,
        rowHeight,
      }),
      rowCount: data.length,
      rowIndex: focusedRowIndex ?? 0,
    });

    if (next === undefined) return false;

    const targetRow = data[next.rowIndex];
    const targetColumnKey = columnKeys[next.columnIndex];

    if (targetRow === undefined || targetColumnKey === undefined) return false;

    commitTableFocusTarget({
      columnKey: targetColumnKey,
      container: containerRef.current,
      focusStore,
      rowHeight,
      rowIndex: next.rowIndex,
      rowKey: resolveRowKey({
        columns,
        index: next.rowIndex,
        row: targetRow,
      }),
    });

    return true;
  };
};
