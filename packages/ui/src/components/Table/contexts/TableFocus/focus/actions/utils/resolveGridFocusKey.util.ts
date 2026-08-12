export type GridFocusPosition = {
  readonly columnIndex: number;
  readonly rowIndex: number;
};

type ResolveGridFocusKeyArgs = {
  readonly columnIndex: number;
  readonly isRangeModifier: boolean;
  readonly key: string;
  readonly lastColumnIndex: number;
  readonly lastRowIndex: number;
  readonly pageRows: number;
  readonly rowIndex: number;
};

/**
 * The grid keyboard map, as a pure function of the key and the current
 * position. `undefined` means the grid does not claim the key, which is also
 * what tells the caller not to call `preventDefault`.
 *
 * This is the WAI-ARIA grid pattern, which `role="grid"` commits the Table to
 * (ADR-062): arrows move one cell, `Home`/`End` move within the row, the same
 * two with a range modifier move to the first/last cell of the grid, and
 * `PageUp`/`PageDown` move by a viewport of rows.
 *
 * The result is deliberately unclamped — a move past an edge is a real answer
 * that the caller bounds against the grid it actually has.
 */
export const resolveGridFocusKey = ({
  columnIndex,
  isRangeModifier,
  key,
  lastColumnIndex,
  lastRowIndex,
  pageRows,
  rowIndex,
}: ResolveGridFocusKeyArgs): GridFocusPosition | undefined => {
  switch (key) {
    case 'ArrowDown': {
      return { columnIndex, rowIndex: rowIndex + 1 };
    }
    case 'ArrowLeft': {
      return { columnIndex: columnIndex - 1, rowIndex };
    }
    case 'ArrowRight': {
      return { columnIndex: columnIndex + 1, rowIndex };
    }
    case 'ArrowUp': {
      return { columnIndex, rowIndex: rowIndex - 1 };
    }
    case 'End': {
      return {
        columnIndex: lastColumnIndex,
        rowIndex: isRangeModifier ? lastRowIndex : rowIndex,
      };
    }
    case 'Home': {
      return { columnIndex: 0, rowIndex: isRangeModifier ? 0 : rowIndex };
    }
    case 'PageDown': {
      return { columnIndex, rowIndex: rowIndex + pageRows };
    }
    case 'PageUp': {
      return { columnIndex, rowIndex: rowIndex - pageRows };
    }
    default: {
      return undefined;
    }
  }
};
