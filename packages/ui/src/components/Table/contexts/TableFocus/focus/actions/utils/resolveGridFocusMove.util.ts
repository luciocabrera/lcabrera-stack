import type { GridFocusPosition } from './resolveGridFocusKey.util';

import { resolveGridFocusKey } from './resolveGridFocusKey.util';

type ResolveGridFocusMoveArgs = {
  readonly columnCount: number;
  readonly columnIndex: number;
  readonly hasFocusedCell: boolean;
  readonly isRangeModifier: boolean;
  readonly key: string;
  readonly pageRows: number;
  readonly rowCount: number;
  readonly rowIndex: number;
};

const clampIndex = ({ max, value }: { max: number; value: number }) =>
  Math.min(Math.max(value, 0), max);

/**
 * Where a key press lands in this grid: `resolveGridFocusKey`'s answer, bounded
 * by the grid's real extent. `undefined` means no move — either the key is not
 * a grid key, or there is nothing to move within.
 *
 * A grid the user has not entered yet has no current cell, so the first grid
 * key focuses the first cell rather than moving one step from a position that
 * does not exist.
 *
 * Clamping rather than wrapping is the grid pattern's own rule: `ArrowDown` on
 * the last row is a no-op, not a jump back to the top.
 */
export const resolveGridFocusMove = ({
  columnCount,
  columnIndex,
  hasFocusedCell,
  isRangeModifier,
  key,
  pageRows,
  rowCount,
  rowIndex,
}: ResolveGridFocusMoveArgs): GridFocusPosition | undefined => {
  if (columnCount <= 0 || rowCount <= 0) return undefined;

  const lastColumnIndex = columnCount - 1;
  const lastRowIndex = rowCount - 1;

  const next = resolveGridFocusKey({
    columnIndex: clampIndex({ max: lastColumnIndex, value: columnIndex }),
    isRangeModifier,
    key,
    lastColumnIndex,
    lastRowIndex,
    pageRows: Math.max(pageRows, 1),
    rowIndex: clampIndex({ max: lastRowIndex, value: rowIndex }),
  });

  if (next === undefined) return undefined;

  if (!hasFocusedCell) return { columnIndex: 0, rowIndex: 0 };

  return {
    columnIndex: clampIndex({ max: lastColumnIndex, value: next.columnIndex }),
    rowIndex: clampIndex({ max: lastRowIndex, value: next.rowIndex }),
  };
};
