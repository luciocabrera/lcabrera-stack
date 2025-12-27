import * as stylex from '@stylexjs/stylex';
import { useEffect, useState } from 'react';

import type { TableBodyProps } from './TableBody.types';

import { TableCell } from '../TableCell';
import { TableRow } from '../TableRow';
import { styles } from './TableBody.stylex';

export const TableBody = <T extends Record<string, unknown>>({
  columns,
  data,
  overscan,
  rowHeight,
  tableContainerRef,
}: TableBodyProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  useEffect(() => {
    const container = tableContainerRef.current;

    function updateHeight() {
      setContainerHeight(container?.offsetHeight ?? 400);
    }

    const handleScroll = () => {
      setScrollTop(container?.scrollTop ?? 0);
    };

    updateHeight();
    container?.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateHeight);

    return () => {
      container?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateHeight);
    };
  }, [tableContainerRef]);

  const totalRows = data.length;
  const visibleCount = Math.ceil(containerHeight / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(totalRows, startIndex + visibleCount + overscan * 2);
  const offsetY = startIndex * rowHeight;
  const visibleRows = data.slice(startIndex, endIndex);
  const totalHeight = totalRows * rowHeight;
  const bottomSpacerHeight = totalHeight - (offsetY + visibleRows.length * rowHeight);

  return (
    <tbody data-testid="table-body" {...stylex.props(styles.body(totalHeight))}>
      {/* Top spacer row */}
      {offsetY > 0 && (
        <tr aria-hidden="true" {...stylex.props(styles.spacerRow(offsetY))}>
          <td colSpan={columns.length} {...stylex.props(styles.spacerCell(offsetY))} />
        </tr>
      )}
      {visibleRows.map((row, index) => {
        const rowIndex = startIndex + index;
        const isStriped = rowIndex % 2 === 1;
        return (
          <TableRow isStriped={isStriped} key={rowIndex}>
            {columns.map((col) => (
              <TableCell key={col.key} minWidth={col.minWidth ?? 120}>
                {col.key in row ? String(row[col.key]) : ''}
              </TableCell>
            ))}
          </TableRow>
        );
      })}
      {/* Bottom spacer row */}
      {totalRows > 0 && bottomSpacerHeight > 0 && (
        <tr aria-hidden="true" {...stylex.props(styles.spacerRow(bottomSpacerHeight))}>
          <td colSpan={columns.length} {...stylex.props(styles.spacerCell(bottomSpacerHeight))} />
        </tr>
      )}
    </tbody>
  );
};
