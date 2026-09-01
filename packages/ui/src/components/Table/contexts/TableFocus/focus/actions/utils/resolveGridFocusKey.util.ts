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
