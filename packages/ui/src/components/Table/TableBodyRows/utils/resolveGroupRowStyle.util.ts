import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { tableBodyRowsStyles } from '../TableBodyRows.stylex';

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
