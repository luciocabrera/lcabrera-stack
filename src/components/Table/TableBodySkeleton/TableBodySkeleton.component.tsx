import * as stylex from '@stylexjs/stylex';

import type { TableBodySkeletonProps } from './TableBodySkeleton.types';

import { SkeletonCell } from '../SkeletonCell';
import { TableRow } from '../TableRow';
import { tableBodySkeletonStyles } from './TableBodySkeleton.stylex';

/**
 * Skeleton placeholder for table body during loading
 *
 * Renders skeleton rows matching the column structure with
 * animated placeholder cells sized by data type.
 */
export const TableBodySkeleton = ({
  columns,
  rowCount,
  rowHeight,
}: TableBodySkeletonProps) => (
  <tbody aria-hidden='true' {...stylex.props(tableBodySkeletonStyles.body)}>
    {[...Array.from({ length: rowCount }).keys()].map((rowIndex) => (
      <TableRow
        customStylex={tableBodySkeletonStyles.row(rowHeight)}
        isStriped={false}
        key={`skeleton-row-${String(rowIndex)}`}
      >
        {columns.map((column) => (
          <td
            key={`skeleton-cell-${column.key}`}
            {...stylex.props(tableBodySkeletonStyles.cell(column.minWidth))}
          >
            <SkeletonCell dataType={column.dataType} />
          </td>
        ))}
      </TableRow>
    ))}
  </tbody>
);
