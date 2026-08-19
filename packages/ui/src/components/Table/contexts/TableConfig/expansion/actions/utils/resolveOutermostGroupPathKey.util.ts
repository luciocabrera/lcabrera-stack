import type {
  TableColumn,
  TableGroupKeyValue,
} from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';
import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

type ResolveOutermostGroupPathKeyArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  /** Identity of the row the grid's focus points at, `undefined` when it points at none. */
  readonly focusedRowKey: string | undefined;
  /** The rows on screen **before** the fold, in order. */
  readonly rows: readonly TData[];
};

/**
 * The top-level group a row sits inside, as a path key — the ancestor that
 * survives a collapse-all, so the one focus falls back to (#774).
 *
 * `resolveGroupCollapseFocusTarget` needs the collapsed group's path key, and
 * for a single collapse the caller already has it: it is the path it just
 * folded. Collapse-all has no such path — it folds every level at once — so the
 * ancestor has to be read back off the focused row instead, which is all this
 * does. The two are kept apart rather than generalised because their inputs
 * differ, not their intent: one is told the ancestor, the other must find it.
 *
 * A row's own path is what answers it, never its position, for the reason
 * `resolveGroupTreeNodes` states: rollup emits a subtotal after the rows it
 * totals, so a walk over neighbours reads the wrong group. A **detail** row is
 * the one exception, there and here alike — it carries no path of its own, so
 * the nearest group row above it is the only thing that can say where it sits.
 *
 * `undefined` means focus has nowhere to fall back to and should be left alone:
 * no row is focused, the focused row is not in this list, or it is the grand
 * total, whose path is empty and which no collapse can hide (ADR-065).
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
