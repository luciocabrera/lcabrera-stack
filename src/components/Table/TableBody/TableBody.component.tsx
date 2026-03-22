import * as stylex from '@stylexjs/stylex';

import { DEFAULT_MIN_COLUMN_WIDTH } from '@/components/Table/Table.constants';
import {
  useGetColumnGroups,
  useGetColumnSizing,
  useGetPinnedColumnOffsets,
} from '@/components/Table/contexts/TableConfig/columns/selectors';
import {
  useGetTableOverscan,
  useGetTableRowHeight,
} from '@/components/Table/contexts/TableConfig/meta/selectors';
import { SpacerRow } from '@/components/Table/SpacerRow';
import { TableBodyCell } from '@/components/Table/TableBodyCell';
import { TableRow } from '@/components/Table/TableRow';
import { useVirtualization } from '@/hooks';
import { useRenderTracker } from '@/utils/performance';

import type { TableBodyProps } from './TableBody.types';

import { useGetTableData } from '../contexts/TableData/data/selectors';
import { styles } from './TableBody.stylex';

export const TableBody = ({ tableContainerRef }: TableBodyProps) => {
  useRenderTracker({ componentName: 'TableBody' });

  const columnSizing = useGetColumnSizing();
  const { centerCols, leftPinnedCols, rightPinnedCols } = useGetColumnGroups();
  const pinnedOffsets = useGetPinnedColumnOffsets();
  const data = useGetTableData();
  const rowHeight = useGetTableRowHeight();
  const overscan = useGetTableOverscan();

  const { bottomSpacerHeight, endIndex, offsetY, startIndex, totalHeight } =
    useVirtualization({
      containerRef: tableContainerRef,
      itemHeight: rowHeight,
      overscan,
      totalItems: data.length,
    });

  const visibleRows = data.slice(startIndex, endIndex);
  const totalRows = data.length;
  const totalVisibleColCount =
    leftPinnedCols.length + centerCols.length + rightPinnedCols.length;

  return (
    <tbody data-testid='table-body' {...stylex.props(styles.body(totalHeight))}>
      {offsetY > 0 && (
        <SpacerRow colSpan={totalVisibleColCount} height={offsetY} />
      )}
      {visibleRows.map((row, index) => {
        const rowIndex = startIndex + index;
        const rowData = row as Record<string, unknown>;

        const renderBodyCell = (col: (typeof centerCols)[number]) => {
          const minWidth = col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
          const width = columnSizing[col.key] ?? minWidth;
          const pinInfo = pinnedOffsets[col.key];

          if (col.render) {
            return (
              <TableBodyCell
                key={col.key}
                label=''
                minWidth={minWidth}
                pinInfo={pinInfo}
                width={width}
              >
                {col.render(rowData)}
              </TableBodyCell>
            );
          }

          return (
            <TableBodyCell
              dataType={col.dataType}
              format={col.format}
              key={col.key}
              label={col.label}
              minWidth={minWidth}
              pinInfo={pinInfo}
              value={col.key in rowData ? rowData[col.key] : ''}
              width={width}
            />
          );
        };

        return (
          <TableRow key={rowIndex}>
            {leftPinnedCols.map((col) => renderBodyCell(col))}
            {centerCols.map((col) => renderBodyCell(col))}
            {rightPinnedCols.map((col) => renderBodyCell(col))}
          </TableRow>
        );
      })}
      {totalRows > 0 && bottomSpacerHeight > 0 && (
        <SpacerRow colSpan={totalVisibleColCount} height={bottomSpacerHeight} />
      )}
    </tbody>
  );
};
