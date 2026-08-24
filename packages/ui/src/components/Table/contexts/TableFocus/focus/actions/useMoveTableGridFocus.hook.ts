import { useToggleTableGroupExpansion } from '#ui/components/Table/contexts/TableConfig/expansion/actions';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';
import { useTableContainerRef } from '#ui/components/Table/contexts/TableWrapper';
import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';

import type { MoveTableGridFocusArgs } from './useMoveTableGridFocus.types';

import {
  commitTableFocusTarget,
  getGridPageRows,
  resolveFocusedGridCell,
  resolveFocusedGroupFold,
  resolveGridFocusContext,
  resolveGridFocusMove,
  resolveGroupExpansionKey,
} from './utils';

/**
 * Moves the grid's single tab stop in response to a key, and answers whether the key was
 * one the grid claims — which is what the caller preventDefaults on, so an unclaimed key
 * still scrolls the page.
 * That is the point of holding focus as data (ADR-062) — the old row can be unmounted and
 * the new one not yet mounted, and the move still lands.
 */
export const useMoveTableGridFocus = <
  TData extends Record<string, unknown>,
>() => {
  const { focusStore } = useTableFocusContextValue();
  const { columnsStore, expansionStore, groupingStore, metaStore } =
    useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue<TData>();
  const containerRef = useTableContainerRef();
  const toggleGroupExpansion = useToggleTableGroupExpansion<TData>();

  return ({ isRangeModifier, key }: MoveTableGridFocusArgs) => {
    const focusState = focusStore.get();
    const { columnKeys, columns, data, focusedRowIndex, rowHeight, rowMeta } =
      resolveGridFocusContext({
        columnsState: columnsStore.get(),
        dataState: dataStore.get(),
        expansionState: expansionStore.get(),
        focusState,
        groupingState: groupingStore.get(),
        metaState: metaStore.get(),
      });

    const {
      columnIndex: currentColumnIndex,
      groupPath: focusedGroupPath,
      hasFocusedCell,
      meta: focusedMeta,
    } = resolveFocusedGridCell({
      columnKeys,
      data,
      focusedRowIndex,
      focusState,
      rowMeta,
    });

    const fold = resolveFocusedGroupFold({
      columnKey: focusState.columnKey,
      groupPath: focusedGroupPath,
      meta: focusedMeta,
    });

    const expansion = resolveGroupExpansionKey({
      hasChildren: fold.hasChildren,
      isExpanded: fold.isExpanded,
      isGroupRow: hasFocusedCell && focusedGroupPath !== undefined,
      key,
    });

    if (expansion !== undefined && fold.path !== undefined) {
      toggleGroupExpansion(fold.path);

      return true;
    }

    const next = resolveGridFocusMove({
      columnCount: columnKeys.length,
      columnIndex: currentColumnIndex,
      hasFocusedCell,
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
