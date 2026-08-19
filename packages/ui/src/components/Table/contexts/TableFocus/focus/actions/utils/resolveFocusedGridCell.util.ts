import type {
  TableFocusState,
  TableGroupKeyValue,
} from '#ui/components/Table/Table.types';

import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

import type { TableGroupTreeRowMeta } from '../../../../TableConfig/expansion/utils/resolveTableGroupTree.util';

type FocusedGridCell = {
  /** `-1` when the focused column is not among the grid's focusable columns. */
  readonly columnIndex: number;
  /** The focused row's group path, when it is a group row. */
  readonly groupPath: readonly TableGroupKeyValue[] | undefined;
  /** Whether focus currently addresses a real cell — both axes resolved. */
  readonly hasFocusedCell: boolean;
  readonly meta: TableGroupTreeRowMeta | undefined;
};

type ResolveFocusedGridCellArgs<TData extends Record<string, unknown>> = {
  readonly columnKeys: readonly string[];
  /** The **visible** rows, in the index space focus is addressed in. */
  readonly data: readonly TData[];
  readonly focusedRowIndex: number | undefined;
  readonly focusState: TableFocusState;
  readonly rowMeta: readonly TableGroupTreeRowMeta[] | undefined;
};

/**
 * Everything about the cell focus points at right now, resolved from the
 * snapshots a move has already taken.
 *
 * Focus is held as **data** rather than read back from the DOM (ADR-062),
 * because the focused row is unmounted the moment it leaves the virtualization
 * window — so every question about it is a lookup, and there are four of them:
 * which column, whether both axes actually resolved, what the row is in the
 * tree, and whether it is a group. Answering them inline is what made the move
 * hook's branching outgrow its complexity budget.
 *
 * A missing answer is `undefined` rather than a throw: focus legitimately points
 * at nothing before the grid is entered, and at a row outside the window, and
 * the caller's job is to move it rather than to object.
 */
export const resolveFocusedGridCell = <TData extends Record<string, unknown>>({
  columnKeys,
  data,
  focusedRowIndex,
  focusState,
  rowMeta,
}: ResolveFocusedGridCellArgs<TData>): FocusedGridCell => {
  const columnIndex =
    focusState.columnKey === undefined
      ? -1
      : columnKeys.indexOf(focusState.columnKey);

  if (focusedRowIndex === undefined) {
    return {
      columnIndex,
      groupPath: undefined,
      hasFocusedCell: false,
      meta: undefined,
    };
  }

  const row = data[focusedRowIndex];

  return {
    columnIndex,
    groupPath:
      row === undefined ? undefined : getTableGroupRowSummary(row)?.path,
    hasFocusedCell: columnIndex >= 0,
    meta: rowMeta?.[focusedRowIndex],
  };
};
