import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';

type ResolveFocusedRowIndexArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly data: readonly TData[];
  readonly rowIndex: number | undefined;
  readonly rowKey: string | undefined;
};

/**
 * Where the focused row sits in the rows loaded right now, or `undefined` when
 * the grid holds no focus target and when there is nothing to hold one.
 *
 * This is ADR-062's focus-recovery rule made executable. The stored index is
 * checked first and is right in the ordinary case, so the scan below runs only
 * after the data underneath focus has actually moved — a sort, a filter or a
 * delete. When the row survives somewhere else it is found by identity; when it
 * is gone, focus falls to the nearest surviving row at the same absolute index
 * rather than to nothing, which is what keeps it out of `<body>`.
 *
 * `resolveRowKey` is the same derivation the rendered rows are keyed by, so
 * "the row this key identifies" means one thing in both places.
 */
export const resolveFocusedRowIndex = <TData extends Record<string, unknown>>({
  columns,
  data,
  rowIndex,
  rowKey,
}: ResolveFocusedRowIndexArgs<TData>) => {
  if (rowKey === undefined || data.length === 0) return;

  const lastIndex = data.length - 1;
  const storedRow = rowIndex === undefined ? undefined : data[rowIndex];

  if (
    rowIndex !== undefined &&
    storedRow !== undefined &&
    resolveRowKey({ columns, index: rowIndex, row: storedRow }) === rowKey
  ) {
    return rowIndex;
  }

  const foundIndex = data.findIndex(
    (row, index) => resolveRowKey({ columns, index, row }) === rowKey,
  );

  if (foundIndex !== -1) return foundIndex;

  return Math.min(Math.max(rowIndex ?? 0, 0), lastIndex);
};
