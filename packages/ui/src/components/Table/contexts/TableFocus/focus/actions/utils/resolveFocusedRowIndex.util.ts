import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';

type ResolveFocusedRowIndexArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly data: readonly TData[];
  readonly rowIndex: number | undefined;
  readonly rowKey: string | undefined;
};

/** This is ADR-062's focus-recovery rule made executable. */
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
