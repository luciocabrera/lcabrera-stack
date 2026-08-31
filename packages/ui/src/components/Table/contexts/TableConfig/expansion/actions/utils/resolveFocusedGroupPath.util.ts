import type {
  TableColumn,
  TableGroupKeyValue,
} from '#ui/components/Table/Table.types';

import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';
import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

type ResolveFocusedGroupPathArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly focusedRowKey: string | undefined;
  readonly rows: readonly TData[];
};

export const resolveFocusedGroupPath = <TData extends Record<string, unknown>>({
  columns,
  focusedRowKey,
  rows,
}: ResolveFocusedGroupPathArgs<TData>) => {
  if (focusedRowKey === undefined) return;

  const focusedIndex = rows.findIndex(
    (row, index) => resolveRowKey({ columns, index, row }) === focusedRowKey,
  );

  if (focusedIndex === -1) return;

  const selfAndAbove = rows.slice(0, focusedIndex + 1);
  let path: readonly TableGroupKeyValue[] | undefined;

  for (const row of selfAndAbove) {
    const summary = getTableGroupRowSummary(row);

    if (summary !== undefined) path = summary.path;
  }

  return path;
};
