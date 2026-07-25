import type { SortingState } from '@lcabrera/ui/components/Table';

import type { EnterpriseOrderListRow } from '../config';

type ToOrderCursorValuesArgs = {
  readonly lastRow?: EnterpriseOrderListRow;
  readonly sorting: SortingState<EnterpriseOrderListRow>;
};

/**
 * The keyset cursor for the next page: the sort-key tuple of the last row the
 * table has, in the same order the query will sort by (ADR-052).
 *
 * The synthetic `actions` column is dropped, because `toOrderQuerySort` drops it
 * server-side too — the tuple has to line up with the sort the query actually
 * runs, position for position, or the cursor is meaningless.
 *
 * `undefined` on the first page of a session, when there is no row to resume
 * after — the server then falls back to `OFFSET`, which is what page one means
 * anyway.
 */
export const toOrderCursorValues = ({
  lastRow,
  sorting,
}: ToOrderCursorValuesArgs) => {
  if (lastRow === undefined) {
    return;
  }

  return sorting.flatMap(({ columnKey }) =>
    columnKey === 'actions' ? [] : [lastRow[columnKey]],
  );
};
