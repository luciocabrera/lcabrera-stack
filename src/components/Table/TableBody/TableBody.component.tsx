import * as stylex from '@stylexjs/stylex';

import {
  useGetColumnPinning,
  useGetColumnSizing,
  useGetEffectiveColumns,
} from '@/components/Table/contexts/TableConfig/columns/selectors';
import {
  useGetTableColumnOverscan,
  useGetTableOverscan,
  useGetTableRowHeight,
} from '@/components/Table/contexts/TableConfig/meta/selectors';
import { SpacerRow } from '@/components/Table/SpacerRow';
import { DEFAULT_MIN_COLUMN_WIDTH } from '@/components/Table/Table.constants';
import { TableBodyCell } from '@/components/Table/TableBodyCell';
import { TableRow } from '@/components/Table/TableRow';
import {
  getPinnedColumnOffsets,
  splitColumnsByPinning,
} from '@/components/Table/utils';
import { useColumnVirtualization, useVirtualization } from '@/hooks';
import { useRenderTracker } from '@/utils/performance';

import type { TableBodyProps } from './TableBody.types';

import { useGetTableData } from '../contexts/TableData/data/selectors';
import { useTableContainerRef } from '../contexts/TableWrapper';
import { SpacerCell } from '../SpacerCell';
import { styles } from './TableBody.stylex';

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
  const columnOverscan = useGetTableColumnOverscan();
  const containerRef = useTableContainerRef();

  const { bottomSpacerHeight, endIndex, offsetY, startIndex, totalHeight } =
    useVirtualization({
      containerRef: tableContainerRef,
      itemHeight: rowHeight,
      overscan,
      totalItems: data.length,
    });

  const { centerCols, centerColumnWidths, leftPinnedCols, rightPinnedCols } =
    splitColumnsByPinning({ columnPinning, columnSizing, effectiveColumns });

  const {
    endIndex: colEndIndex,
    leftSpacerWidth,
    rightSpacerWidth,
    startIndex: colStartIndex,
  } = useColumnVirtualization({
    columnWidths: centerColumnWidths,
    containerRef,
    overscan: columnOverscan,
  });

  const visibleCenterCols = centerCols.slice(colStartIndex, colEndIndex);
  const visibleRows = data.slice(startIndex, endIndex);
  const totalRows = data.length;
  // Total visible column count (pinned + visible center) for SpacerRow colSpan
  const totalVisibleColCount =
    leftPinnedCols.length +
    (leftSpacerWidth > 0 ? 1 : 0) +
    visibleCenterCols.length +
    (rightSpacerWidth > 0 ? 1 : 0) +
    rightPinnedCols.length;

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
            {leftPinnedCols.map((col) => {
              const effectiveMinWidth =
                col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
              const finalWidth = columnSizing[col.key] ?? effectiveMinWidth;

              if (col.render) {
                return (
                  <TableBodyCell
                    key={col.key}
                    label={''}
                    minWidth={effectiveMinWidth}
                    pinInfo={pinnedOffsets[col.key]}
                    width={finalWidth}
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
                  minWidth={effectiveMinWidth}
                  pinInfo={pinnedOffsets[col.key]}
                  value={col.key in rowData ? rowData[col.key] : ''}
                  width={finalWidth}
                />
              );
            })}
            {leftSpacerWidth > 0 && <SpacerCell width={leftSpacerWidth} />}
            {visibleCenterCols.map((col) => {
              const effectiveMinWidth =
                col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
              const finalWidth = columnSizing[col.key] ?? effectiveMinWidth;

              if (col.render) {
                return (
                  <TableBodyCell
                    key={col.key}
                    label={''}
                    minWidth={effectiveMinWidth}
                    pinInfo={pinnedOffsets[col.key]}
                    width={finalWidth}
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
                  minWidth={effectiveMinWidth}
                  pinInfo={pinnedOffsets[col.key]}
                  value={col.key in rowData ? rowData[col.key] : ''}
                  width={finalWidth}
                />
              );
            })}
            {rightSpacerWidth > 0 && <SpacerCell width={rightSpacerWidth} />}
            {rightPinnedCols.map((col) => {
              const effectiveMinWidth =
                col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
              const finalWidth = columnSizing[col.key] ?? effectiveMinWidth;

              if (col.render) {
                return (
                  <TableBodyCell
                    key={col.key}
                    label={''}
                    minWidth={effectiveMinWidth}
                    pinInfo={pinnedOffsets[col.key]}
                    width={finalWidth}
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
                  minWidth={effectiveMinWidth}
                  pinInfo={pinnedOffsets[col.key]}
                  value={col.key in rowData ? rowData[col.key] : ''}
                  width={finalWidth}
                />
              );
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
