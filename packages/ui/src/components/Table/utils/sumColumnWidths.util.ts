import type { ColumnSizingState, TableColumn } from '../Table.types';

import { resolveColumnStartWidth } from './resolveColumnStartWidth.util';

type SumColumnWidthsArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing: ColumnSizingState<TData>;
};

export const sumColumnWidths = <TData>({
  columns,
  columnSizing,
}: SumColumnWidthsArgs<TData>) =>
  columns.reduce(
    (total, column) =>
      total + (columnSizing[column.key] ?? resolveColumnStartWidth(column)),
    0,
  );
