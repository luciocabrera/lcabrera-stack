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

/**
 * The group the focused row sits in, as a path — its own when it is a group row, else the
 * nearest group row above it, which is how a detail row gets an ancestry at all.
 * `undefined` means there is nothing to fall back from: no row is focused, or the focused
 * row is not in this list.
 */
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

  // Walked forwards, keeping the last group row seen at or before the focused
  // one — the nearest group *above* it, without reversing anything. A reversed
  // walk would read more directly and is avoided: `toReversed` is a runtime
  // method, and this package ships source, so a consumer's downlevel target
  // emits it verbatim rather than rewriting it (see `resolveTableGroupTree`).
  const selfAndAbove = rows.slice(0, focusedIndex + 1);
  let path: readonly TableGroupKeyValue[] | undefined;

  for (const row of selfAndAbove) {
    const summary = getTableGroupRowSummary(row);

    if (summary !== undefined) path = summary.path;
  }

  return path;
};
