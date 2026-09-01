type ResolveAriaRowCountArgs = {
  readonly isLoading: boolean;
  readonly totalRows: number;
};

type ResolveBodyAriaRowIndexArgs = {
  readonly rowIndex: number;
};

const UNKNOWN_ROW_COUNT = -1;

export const HEADER_ARIA_ROW_INDEX = 1;

export const resolveAriaRowCount = ({
  isLoading,
  totalRows,
}: ResolveAriaRowCountArgs) =>
  isLoading ? UNKNOWN_ROW_COUNT : totalRows + HEADER_ARIA_ROW_INDEX;

export const resolveBodyAriaRowIndex = ({
  rowIndex,
}: ResolveBodyAriaRowIndexArgs) => rowIndex + HEADER_ARIA_ROW_INDEX + 1;
