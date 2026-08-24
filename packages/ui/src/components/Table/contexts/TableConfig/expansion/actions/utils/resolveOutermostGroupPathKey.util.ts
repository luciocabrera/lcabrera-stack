import type {
  TableColumn,
  TableGroupKeyValue,
} from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';
import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

type ResolveOutermostGroupPathKeyArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly focusedRowKey: string | undefined;
  readonly rows: readonly TData[];
};

/**
 * A row's own path is what answers it, never its position, for the reason
 * `resolveGroupTreeNodes` states: rollup emits a subtotal after the rows it totals, so a
 * walk over neighbours reads the wrong group.
 * `undefined` means focus has nowhere to fall back to and should be left alone: no row is
 * focused, the focused row is not in this list, or it is the grand total, whose path is
 * empty and which no collapse can hide (ADR-065).
 */
export const resolveOutermostGroupPathKey = <
  TData extends Record<string, unknown>,
>({
  columns,
  focusedRowKey,
  rows,
}: ResolveOutermostGroupPathKeyArgs<TData>) => {
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
  let outermost: readonly TableGroupKeyValue[] | undefined;

  for (const row of selfAndAbove) {
    const summary = getTableGroupRowSummary(row);

    if (summary !== undefined) outermost = summary.path.slice(0, 1);
  }

  return outermost === undefined || outermost.length === 0
    ? undefined
    : resolveGroupPathKey(outermost);
};
