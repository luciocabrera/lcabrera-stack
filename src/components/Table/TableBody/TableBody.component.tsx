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
import { logger } from '@/utils/logger';
import { useRenderTracker } from '@/utils/performance';
import * as stylex from '@stylexjs/stylex';

import type { TableBodyProps } from './TableBody.types';

import { styles } from './TableBody.stylex';

import {
  useGetTableData,
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '../contexts/TableData/data/selectors';

export const TableBody = ({ tableContainerRef }: TableBodyProps) => {
  useRenderTracker({ componentName: 'TableBody' });

  const columnSizing = useGetColumnSizing();
  const { centerCols, leftPinnedCols, rightPinnedCols } = useGetColumnGroups();
  const pinnedOffsets = useGetPinnedColumnOffsets();
  const data = useGetTableData();
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();
  const rowHeight = useGetTableRowHeight();
  const overscan = useGetTableOverscan();
  const isLoadingState = isLoading || isLoadingMore;

  const { bottomSpacerHeight, endIndex, offsetY, startIndex, totalHeight } =
    useVirtualization({
      containerRef: tableContainerRef,
      itemHeight: rowHeight,
      overscan,
      totalItems: data.length,
    });

  logger.debug('Virtualization output:', {
    endIndex,
    offsetY,
    startIndex,
    totalHeight,
    totalRows: data.length,
  });

  const visibleRows = data.slice(startIndex, endIndex);
  const totalColSpan =
    leftPinnedCols.length + centerCols.length + rightPinnedCols.length;

  return (
    <tbody data-testid='table-body' {...stylex.props(styles.body(totalHeight))}>
      {offsetY > 0 && <SpacerRow colSpan={totalColSpan} height={offsetY} />}
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
                isLoadingState={isLoadingState}
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
              isLoadingState={isLoadingState}
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
      {bottomSpacerHeight > 0 && (
        <SpacerRow colSpan={totalColSpan} height={bottomSpacerHeight} />
      )}
    </tbody>
  );
};
