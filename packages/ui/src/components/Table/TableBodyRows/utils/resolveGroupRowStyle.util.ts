import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { tableBodyRowsStyles } from '../TableBodyRows.stylex';

/**
 * The ground a row paints on, from what the row says it is.
 *
 * Three kinds, resolved in an order that is not interchangeable. **The grand
 * total is tested first because it is also a subtotal** — it rolls up every
 * key, so `isSubtotal` is true on it as well, and asking that question first
 * would paint the end of the table as one more level total. What separates them
 * is the path: a subtotal still names the level it totals, the grand total
 * names nothing and carries no entries at all.
 *
 * A detail row has no summary and gets no style, which leaves `TableRow`'s
 * striping to it — the one row kind whose alternation carries no false meaning.
 */
export const resolveGroupRowStyle = (
  summary: TableGroupRowSummary | undefined,
) => {
  if (summary === undefined) {
    return;
  }

  if (summary.path.length === 0) {
    return tableBodyRowsStyles.grandTotalRow;
  }

  return summary.isSubtotal
    ? tableBodyRowsStyles.subtotalRow
    : tableBodyRowsStyles.groupRow;
};
