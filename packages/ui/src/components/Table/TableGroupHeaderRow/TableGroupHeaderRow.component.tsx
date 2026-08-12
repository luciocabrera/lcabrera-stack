import * as stylex from '@stylexjs/stylex';

import { GroupRowsIcon } from '#ui/components/Icons';
import {
  useGetNormalizedColumn,
  useGetPinnedColumnPartition,
} from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { TableRow } from '#ui/components/Table/TableRow';

import type { TableGroupHeaderRowProps } from './TableGroupHeaderRow.types';

import { tableGroupHeaderRowStyles } from './TableGroupHeaderRow.stylex';

/**
 * One group of a grouped read, rendered as an ordinary body row: the grouped
 * column's label, the group's key value, and how many rows it aggregates.
 *
 * It composes `TableRow` rather than emitting its own `<tr>`, which is what
 * keeps the virtualization height invariant intact — `TableRow` is where
 * `rowHeight` is read, and `<tbody>`'s declared height is
 * `totalLoadedRows × rowHeight` whether those rows are groups or details.
 *
 * The column's human label comes from the columns store rather than the row,
 * because a group summary carries the column *key*: the label is a property of
 * the table's configuration, not of the data.
 */
export const TableGroupHeaderRow = ({ summary }: TableGroupHeaderRowProps) => {
  const { centerCols, leftPinnedCols, rightPinnedCols } =
    useGetPinnedColumnPartition();
  const column = useGetNormalizedColumn<Record<string, unknown>>(
    summary.columnKey,
  );
  const colSpan =
    leftPinnedCols.length + centerCols.length + rightPinnedCols.length;

  return (
    <TableRow
      customStylex={tableGroupHeaderRowStyles.row}
      data-testid='table-group-header-row'
      isStriped={false}
    >
      <td colSpan={colSpan} {...stylex.props(tableGroupHeaderRowStyles.cell)}>
        <span {...stylex.props(tableGroupHeaderRowStyles.icon)}>
          <GroupRowsIcon size={14} />
        </span>
        <span {...stylex.props(tableGroupHeaderRowStyles.label)}>
          {`${column?.label ?? summary.columnKey}: ${summary.label}`}
        </span>
        <span {...stylex.props(tableGroupHeaderRowStyles.count)}>
          {`(${summary.count})`}
        </span>
      </td>
    </TableRow>
  );
};
