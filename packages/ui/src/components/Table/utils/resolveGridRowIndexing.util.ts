type ResolveAriaRowCountArgs = {
  readonly isLoading: boolean;
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
 * data.
 *
 * **Zero is a count, not a missing one.** A filter that matches nothing is an
 * ordinary outcome, and answering `-1` there would tell a screen-reader user the
 * table's size is unknowable at the exact moment it is most definitely known: it
 * holds one row, the header. `isLoading` is what actually distinguishes the two,
 * and it is not a proxy — `getInitialDataState` defaults it to `true` alongside
 * `totalRows: 0`, and the value only becomes meaningful once the response it is
 * derived from has resolved. So `-1` is reserved for the state where the total
 * genuinely is not known yet, and every resolved state reports a real count.
 */
export const resolveAriaRowCount = ({
  isLoading,
  totalRows,
}: ResolveAriaRowCountArgs) =>
  isLoading ? UNKNOWN_ROW_COUNT : totalRows + HEADER_ARIA_ROW_INDEX;

/**
 * A body row's `aria-rowindex`: its absolute position in the dataset, not its
 * offset in the rendered window. `+ 2` because the sequence is 1-based and the
 * header already occupies index 1.
 */
export const resolveBodyAriaRowIndex = ({
  rowIndex,
}: ResolveBodyAriaRowIndexArgs) => rowIndex + HEADER_ARIA_ROW_INDEX + 1;
