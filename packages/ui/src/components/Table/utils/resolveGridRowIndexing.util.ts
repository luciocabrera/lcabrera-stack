type ResolveAriaRowCountArgs = {
  readonly totalRows: number;
};

type ResolveBodyAriaRowIndexArgs = {
  readonly rowIndex: number;
};

/** The value ARIA reserves for "the total number of rows is not known". */
const UNKNOWN_ROW_COUNT = -1;

/**
 * The header row's `aria-rowindex`. ARIA row indices are 1-based and continuous
 * across the whole grid, and the header is the first row in that sequence.
 */
export const HEADER_ARIA_ROW_INDEX = 1;

/**
 * The grid's `aria-rowcount`: the whole dataset plus the header row.
 *
 * `totalRows` is the dataset, never `totalLoadedRows` — a count taken from what
 * has been fetched grows with every page and describes the fetch rather than the
 * data. A consumer that supplied no total leaves it at its `0` default, which is
 * reported as unknown rather than as a grid holding nothing but a header.
 */
export const resolveAriaRowCount = ({ totalRows }: ResolveAriaRowCountArgs) =>
  totalRows > 0 ? totalRows + 1 : UNKNOWN_ROW_COUNT;

/**
 * A body row's `aria-rowindex`: its absolute position in the dataset, not its
 * offset in the rendered window. `+ 2` because the sequence is 1-based and the
 * header already occupies index 1.
 */
export const resolveBodyAriaRowIndex = ({
  rowIndex,
}: ResolveBodyAriaRowIndexArgs) => rowIndex + HEADER_ARIA_ROW_INDEX + 1;
