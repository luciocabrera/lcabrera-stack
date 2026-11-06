type ResolveAriaRowCountArgs = {
  readonly hasFooter?: boolean;
  readonly isLoading: boolean;
  readonly totalRows: number;
};

type ResolveBodyAriaRowIndexArgs = {
  readonly rowIndex: number;
};

const UNKNOWN_ROW_COUNT = -1;

export const HEADER_ARIA_ROW_INDEX = 1;

export const resolveAriaRowCount = ({
  hasFooter = false,
  isLoading,
  totalRows,
}: ResolveAriaRowCountArgs) => {
  if (isLoading) return UNKNOWN_ROW_COUNT;

  return totalRows + HEADER_ARIA_ROW_INDEX + (hasFooter ? 1 : 0);
};

export const resolveBodyAriaRowIndex = ({
  rowIndex,
}: ResolveBodyAriaRowIndexArgs) => rowIndex + HEADER_ARIA_ROW_INDEX + 1;
