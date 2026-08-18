import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import {
  TABLE_GROUP_GRAND_TOTAL_LABEL,
  TABLE_GROUP_SUBTOTAL_SUFFIX,
} from '#ui/components/Table/Table.constants';

type ResolveGroupKeyCellTextArgs = {
  readonly columnKey: string;
  readonly groupingKeys: readonly string[];
  readonly summary: TableGroupRowSummary;
};

/**
 * What one group-key column holds for one group row, or `undefined` when that
 * level is not part of the row's grouping set.
 *
 * `undefined` is the ordinary answer, not an error: a rollup subtotal carries
 * one path entry fewer than the rows it totals, and a cube row carries an
 * arbitrary subset, so most grouped results leave some key columns empty on
 * some rows. **Which columns are filled is the depth signal** (ADR-080) — the
 * reading that works for a tree and a lattice alike, where `path.length - 1`
 * worked only for a tree.
 *
 * **The subtotal suffix goes on the innermost level only.** A subtotal states
 * its ancestry in the columns above it, exactly as a leaf group does; the one
 * column where it differs from a leaf is the level it totals, and that is where
 * the word belongs. Appending it to every filled column would read as several
 * totals rather than one.
 *
 * **The grand total is placed on the first key column** because it is keyed by
 * nothing and so belongs to no column on its own. The outermost key is the
 * column its total is across, and leaving it unplaced would render a row of
 * aggregates with nothing anywhere saying what they total.
 */
export const resolveGroupKeyCellText = ({
  columnKey,
  groupingKeys,
  summary,
}: ResolveGroupKeyCellTextArgs) => {
  const entry = summary.path.find((level) => level.columnKey === columnKey);

  if (entry === undefined) {
    return groupingKeys[0] === columnKey && summary.path.length === 0
      ? { isInnermost: true, text: TABLE_GROUP_GRAND_TOTAL_LABEL }
      : undefined;
  }

  const isInnermost = summary.path.at(-1)?.columnKey === columnKey;

  return {
    isInnermost,
    text:
      isInnermost && summary.isSubtotal
        ? `${entry.label} ${TABLE_GROUP_SUBTOTAL_SUFFIX}`
        : entry.label,
  };
};
