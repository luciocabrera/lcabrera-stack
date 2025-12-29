import * as stylex from '@stylexjs/stylex';

import { useVirtualization } from '@/hooks/useVirtualization.hook';

import type { TableBodyProps } from './TableBody.types';

import { SpacerRow } from '../SpacerRow';
import { TableBodyCell } from '../TableBodyCell';
import { TableRow } from '../TableRow';
import { styles } from './TableBody.stylex';

export const TableBody = <TData extends Record<string, unknown>>({
  columns,
  data,
  overscan,
  rowHeight = 32,
  tableContainerRef,
}: TableBodyProps<TData>) => {
  const { bottomSpacerHeight, endIndex, offsetY, startIndex, totalHeight } =
    useVirtualization({
      containerRef: tableContainerRef,
      itemHeight: rowHeight,
      overscan,
      totalItems: data.length,
    });

  const visibleRows = data.slice(startIndex, endIndex);
  const totalRows = data.length;

  return (
    <tbody data-testid='table-body' {...stylex.props(styles.body(totalHeight))}>
      {/* Top spacer row */}
      {offsetY > 0 && <SpacerRow colSpan={columns.length} height={offsetY} />}
      {visibleRows.map((row, index) => {
        const rowIndex = startIndex + index;
        return (
          <TableRow key={rowIndex}>
            {columns.map((col) => (
              <TableBodyCell
                dataType={col.dataType}
                key={col.key}
                label={col.label}
                minWidth={col.minWidth ?? 120}
                value={col.key in row ? row[col.key] : ''}
              />
            ))}
          </TableRow>
        );
      })}
      {/* Bottom spacer row */}
      {totalRows > 0 && bottomSpacerHeight > 0 && (
        <SpacerRow colSpan={columns.length} height={bottomSpacerHeight} />
      )}
    </tbody>
  );
};
