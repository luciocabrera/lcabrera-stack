type ResolveAriaRowCountArgs = {
  readonly isLoading: boolean;
  readonly totalRows: number;
};

type ResolveBodyAriaRowIndexArgs = {
  readonly rowIndex: number;
};

const UNKNOWN_ROW_COUNT = -1;

export const HEADER_ARIA_ROW_INDEX = 1;

/**
 * `totalRows` is the dataset, never `totalLoadedRows` — a count taken from what has been
 * fetched grows with every page and describes the fetch rather than the data.
 */
export const resolveAriaRowCount = ({
  isLoading,
  totalRows,
}: ResolveAriaRowCountArgs) =>
  isLoading ? UNKNOWN_ROW_COUNT : totalRows + HEADER_ARIA_ROW_INDEX;

export const resolveBodyAriaRowIndex = ({
  rowIndex,
}: ResolveBodyAriaRowIndexArgs) => rowIndex + HEADER_ARIA_ROW_INDEX + 1;
