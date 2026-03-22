import * as stylex from '@stylexjs/stylex';

import {
  useGetColumnPinning,
  useGetColumnSizing,
  useGetEffectiveColumns,
} from '@/components/Table/contexts/TableConfig/columns/selectors';
import {
  // useGetTableColumnOverscan,
  useGetTableOverscan,
  useGetTableRowHeight,
} from '@/components/Table/contexts/TableConfig/meta/selectors';
import { SpacerRow } from '@/components/Table/SpacerRow';
import { TableRow } from '@/components/Table/TableRow';
import {
  getPinnedColumnOffsets,
  splitColumnsByPinning,
} from '@/components/Table/utils';
// import { useColumnVirtualization } from '@/hooks';
import { useVirtualization } from '@/hooks';
import { useRenderTracker } from '@/utils/performance';

import type { TableBodyProps } from './TableBody.types';

import { useGetTableData } from '../contexts/TableData/data/selectors';
// import { useTableContainerRef } from '../contexts/TableWrapper';
// import { SpacerCell } from '../SpacerCell';
import { styles } from './TableBody.stylex';
import {
  createRenderTableBodyCell,
  // getTotalVisibleColumnCount,
  renderTableBodyColumnGroup,
} from './utils/index';

export const TableBody = ({ tableContainerRef }: TableBodyProps) => {
  useRenderTracker({ componentName: 'TableBody' });

  const columnPinning = useGetColumnPinning();
  const columnSizing = useGetColumnSizing();
  const effectiveColumns = useGetEffectiveColumns();
  const data = useGetTableData();

  const pinnedOffsets = getPinnedColumnOffsets({
    columnPinning,
    columnSizing,
    effectiveColumns,
  });
  const rowHeight = useGetTableRowHeight();
  const overscan = useGetTableOverscan();
  // const columnOverscan = useGetTableColumnOverscan();
  // const containerRef = useTableContainerRef();

  const { bottomSpacerHeight, endIndex, offsetY, startIndex, totalHeight } =
    useVirtualization({
      containerRef: tableContainerRef,
      itemHeight: rowHeight,
      overscan,
      totalItems: data.length,
    });

  const { centerCols, leftPinnedCols, rightPinnedCols } = splitColumnsByPinning(
    { columnPinning, columnSizing, effectiveColumns },
  );

  // const {
  //   endIndex: colEndIndex,
  //   leftSpacerWidth,
  //   rightSpacerWidth,
  //   startIndex: colStartIndex,
  // } = useColumnVirtualization({
  //   columnWidths: centerColumnWidths,
  //   containerRef,
  //   overscan: columnOverscan,
  // });

  // const visibleCenterCols = centerCols.slice(colStartIndex, colEndIndex);
  const visibleRows = data.slice(startIndex, endIndex);
  const totalRows = data.length;
  const totalVisibleColCount =
    leftPinnedCols.length + centerCols.length + rightPinnedCols.length;

  const renderBodyCell = createRenderTableBodyCell({
    columnSizing,
    pinnedOffsets,
  });

  return (
    <tbody data-testid='table-body' {...stylex.props(styles.body(totalHeight))}>
      {offsetY > 0 && (
        <SpacerRow colSpan={totalVisibleColCount} height={offsetY} />
      )}
      {visibleRows.map((row, index) => {
        const rowIndex = startIndex + index;
        const rowData = row as Record<string, unknown>;
        return (
          <TableRow key={rowIndex}>
            {renderTableBodyColumnGroup({
              columns: leftPinnedCols,
              renderCell: renderBodyCell,
              rowData,
            })}
            {renderTableBodyColumnGroup({
              columns: centerCols,
              renderCell: renderBodyCell,
              rowData,
            })}
            {renderTableBodyColumnGroup({
              columns: rightPinnedCols,
              renderCell: renderBodyCell,
              rowData,
            })}
          </TableRow>
        );
      })}
      {totalRows > 0 && bottomSpacerHeight > 0 && (
        <SpacerRow colSpan={totalVisibleColCount} height={bottomSpacerHeight} />
      )}
    </tbody>
  );
};
