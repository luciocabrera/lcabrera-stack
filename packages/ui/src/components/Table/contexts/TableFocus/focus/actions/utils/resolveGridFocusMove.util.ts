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
