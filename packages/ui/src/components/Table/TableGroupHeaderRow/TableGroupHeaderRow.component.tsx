import * as stylex from '@stylexjs/stylex';

import { GroupRowsIcon } from '#ui/components/Icons';
import {
  useGetNormalizedColumns,
  useGetPinnedColumnPartition,
} from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { TableRow } from '#ui/components/Table/TableRow';

import type { TableGroupHeaderRowProps } from './TableGroupHeaderRow.types';

import { tableGroupHeaderRowStyles } from './TableGroupHeaderRow.stylex';
import { toGroupHeaderSegments } from './utils';

/**
 * One group of a grouped read, rendered as an ordinary body row: every group
 * key it is identified by, every aggregate selected for it, and how many rows
 * it covers.
 *
 * It composes `TableRow` rather than emitting its own `<tr>`, which is what
 * keeps the virtualization height invariant intact — `TableRow` is where
 * `rowHeight` is read, and `<tbody>`'s declared height is
 * `totalLoadedRows × rowHeight` whether those rows are groups or details.
 *
 * Every column label is read from the store once, as a map, rather than per
 * segment: a hook cannot be called inside the loop that renders a multi-key
 * path, and the labels are a property of the table's configuration rather than
 * of the data anyway.
 */
export const TableGroupHeaderRow = ({
  summary,
  ...rest
}: TableGroupHeaderRowProps) => {
  const { centerCols, leftPinnedCols, rightPinnedCols } =
    useGetPinnedColumnPartition();
  const normalizedColumns = useGetNormalizedColumns();
  const colSpan =
    leftPinnedCols.length + centerCols.length + rightPinnedCols.length;
  const segments = toGroupHeaderSegments({ normalizedColumns, summary });

  return (
    <TableRow
      {...rest}
      customStylex={tableGroupHeaderRowStyles.row}
      data-testid='table-group-header-row'
      isStriped={false}
    >
      <td colSpan={colSpan} {...stylex.props(tableGroupHeaderRowStyles.cell)}>
        <span {...stylex.props(tableGroupHeaderRowStyles.icon)}>
          <GroupRowsIcon size={14} />
        </span>
        {segments.map(({ key, text }) => (
          <span key={key} {...stylex.props(tableGroupHeaderRowStyles.label)}>
            {text}
          </span>
        ))}
        <span {...stylex.props(tableGroupHeaderRowStyles.count)}>
          {`(${summary.count})`}
        </span>
      </td>
    </TableRow>
  );
};
