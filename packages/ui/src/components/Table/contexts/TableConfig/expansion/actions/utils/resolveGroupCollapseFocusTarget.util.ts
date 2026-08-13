import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';
import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

type ResolveGroupCollapseFocusTargetArgs<
  TData extends Record<string, unknown>,
> = {
  readonly columns: readonly TableColumn<TData>[];
  /** Identity of the row the grid's focus points at, `undefined` when it points at none. */
  readonly focusedRowKey: string | undefined;
  /** Path key of the group being collapsed — the ancestor focus falls back to. */
  readonly groupPathKey: string;
  /** The rows that survive the collapse, in order. */
  readonly rows: readonly TData[];
};

/**
 * Where focus goes when a collapse hides the row that held it, or `undefined`
 * when it does not have to move.
 *
 * ADR-062 settles the generic case — a row that disappears hands focus to the
 * nearest survivor at the same absolute index — and says in the same breath
 * that every feature removing rows has to decide whether that answer is its
 * own. For a collapse it is not: the nearest survivor by index is whatever
 * shifted up into that slot, typically a row in a **different** group, so an
 * interaction that only asked to fold something away would move the user
 * sideways in the data. The collapsed group row is the nearest surviving
 * ancestor of everything the collapse hid, so focus lands on the row the user
 * just acted on (ADR-067).
 *
 * One path collapses per call, so every row that disappeared is a descendant of
 * that one group — which is why "the focused row is gone" is enough to identify
 * the ancestor without walking back up the tree for it.
 */
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
