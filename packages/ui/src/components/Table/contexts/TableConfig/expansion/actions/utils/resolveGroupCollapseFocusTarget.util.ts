import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';
import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

type ResolveGroupCollapseFocusTargetArgs<
  TData extends Record<string, unknown>,
> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly focusedRowKey: string | undefined;
  readonly groupPathKey: string;
  readonly rows: readonly TData[];
};

export const resolveGroupCollapseFocusTarget = <
  TData extends Record<string, unknown>,
>({
  columns,
  focusedRowKey,
  groupPathKey,
  rows,
}: ResolveGroupCollapseFocusTargetArgs<TData>) => {
  if (focusedRowKey === undefined) return;

  const rowKeys = rows.map((row, index) =>
    resolveRowKey({ columns, index, row }),
  );

  if (rowKeys.includes(focusedRowKey)) return;

  const rowIndex = rows.findIndex((row) => {
    const summary = getTableGroupRowSummary(row);

    return (
      summary !== undefined &&
      resolveGroupPathKey(summary.path) === groupPathKey
    );
  });
  const rowKey = rowKeys[rowIndex];

  return rowKey === undefined ? undefined : { rowIndex, rowKey };
};
