import * as stylex from '@stylexjs/stylex';

import type { TableBodySkeletonProps } from './TableBodySkeleton.types';

import { SkeletonCell } from '../SkeletonCell';
import { tableBodySkeletonStyles } from './TableBodySkeleton.stylex';

const DEFAULT_ROW_HEIGHT = 40;

/**
 * Skeleton placeholder for table body during loading
 *
 * Renders skeleton rows matching the column structure with
 * animated placeholder cells sized by data type.
 */
export const TableBodySkeleton = ({
  columns,
  rowCount,
  rowHeight = DEFAULT_ROW_HEIGHT,
}: TableBodySkeletonProps) => (
  <tbody aria-hidden='true' {...stylex.props(tableBodySkeletonStyles.body)}>
    {[...Array.from({ length: rowCount }).keys()].map((rowIndex) => (
      <tr
        key={`skeleton-row-${String(rowIndex)}`}
        {...stylex.props(tableBodySkeletonStyles.row(rowHeight))}
      >
        {columns.map((column) => (
          <td
            key={`skeleton-cell-${column.key}`}
            {...stylex.props(tableBodySkeletonStyles.cell(column.minWidth))}
          >
            <SkeletonCell dataType={column.dataType} />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);
